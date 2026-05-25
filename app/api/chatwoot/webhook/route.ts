import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { users, events } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import {
  addChatwootNote,
  getConversationLabelTitles,
  setConversationCustomAttribute,
} from "@/lib/chatwoot";
import { getLatestQuestionnaireAnswers } from "@/lib/db/questionnaire";
import { voluumPostbackUrl } from "@/lib/voluum";
import { cancelPendingNurture } from "@/lib/nurtureSchedule";
import {
  collectLabelTitles,
  conversationHasDepositConfirmedLabel,
  extractDepositAmountUsd,
} from "@/lib/chatwootDeposit";

// Single shared helper used by:
//   - summary log
//   - db match fallback
//   - handleDepositConfirmed
//   - handleReturningUserNote
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function extractTelegramId(payload: any): number | null {
  const raw =
    payload?.conversation?.contact_inbox?.source_id ??
    payload?.contact_inbox?.source_id ??
    payload?.conversation?.messages?.[0]?.conversation?.contact_inbox
      ?.source_id ??
    payload?.conversation?.meta?.sender?.additional_attributes
      ?.social_telegram_user_id ??
    payload?.sender?.additional_attributes?.social_telegram_user_id ??
    payload?.conversation?.messages?.[0]?.sender?.additional_attributes
      ?.social_telegram_user_id ??
    payload?.additional_attributes?.chat_id ??
    payload?.conversation?.additional_attributes?.chat_id ??
    // Legacy fallbacks kept for safety.
    payload?.contact?.additional_attributes?.social_telegram_user_id ??
    payload?.meta?.sender?.identifier ??
    payload?.sender?.identifier;

  const n = Number(raw);
  return Number.isFinite(n) ? n : null;
}

function extractConversationId(
  payload: Record<string, unknown>,
): string | null {
  const conv = payload.conversation as Record<string, unknown> | undefined;
  const id = conv?.id ?? payload.id;
  if (id === undefined || id === null) return null;
  return String(id);
}

function getConversation(
  payload: Record<string, unknown>,
): Record<string, unknown> | undefined {
  return payload.conversation as Record<string, unknown> | undefined;
}

async function handleDepositConfirmed(
  payload: Record<string, unknown>,
): Promise<void> {
  const conversation = getConversation(payload);
  const conversationId = extractConversationId(payload);
  if (!conversationId) {
    console.log("[chatwoot-webhook] deposit handler: no conversationId");
    return;
  }

  const telegramId = extractTelegramId(payload);

  // For API-inbox contacts created by findOrCreateMiniAppConversation,
  // the Telegram id is stored as the contact `identifier` rather than in
  // the Telegram-channel social profile fields.
  const contactIdentifier = (
    payload.contact as Record<string, unknown> | undefined
  )?.identifier as string | undefined;
  const telegramIdFromIdentifier =
    contactIdentifier && /^\d+$/.test(contactIdentifier)
      ? parseInt(contactIdentifier, 10)
      : null;

  const resolvedTelegramId = telegramId ?? telegramIdFromIdentifier;

  const [byConv] = await db
    .select()
    .from(users)
    .where(eq(users.chatwootConversationId, conversationId))
    .limit(1);

  let user = byConv;
  let matchedBy: "conversationId" | "telegramId" | null = byConv
    ? "conversationId"
    : null;
  if (!user && resolvedTelegramId != null) {
    const [byTg] = await db
      .select()
      .from(users)
      .where(eq(users.telegramId, resolvedTelegramId))
      .limit(1);
    user = byTg;
    if (user) matchedBy = "telegramId";
  }

  console.log("[chatwoot-webhook] db match:", {
    matched: !!user,
    matchedBy,
    userId: user?.id ?? null,
  });

  if (!user || !user.miniAppUser) {
    console.log("[chatwoot-webhook] skip: not a mini app user or not matched");
    return;
  }

  // Webhook payload labels can be empty even when a label was applied.
  // Fetch live labels directly from Chatwoot API to get accurate state.
  let titles: string[] = collectLabelTitles(conversation);

  if (titles.length === 0 && conversationId) {
    titles = await getConversationLabelTitles(conversationId);
    console.log(
      `[chatwoot-webhook] fetched live labels for ${conversationId}:`,
      titles,
    );
  }

  const depositConfirmed = conversationHasDepositConfirmedLabel(titles);
  console.log("[chatwoot-webhook] deposit-confirmed detected:", depositConfirmed);
  if (!depositConfirmed) return;

  if (user.bundleUsed) {
    console.log("[chatwoot-webhook] skip: bundleUsed already true");
    return;
  }

  const amount = extractDepositAmountUsd(conversation, payload);
  const depositTotal =
    amount != null ? amount : (user.depositTotal ?? 0) || 0;

  await db
    .update(users)
    .set({
      bundleUsed: true,
      depositTotal: depositTotal > 0 ? depositTotal : user.depositTotal,
    })
    .where(eq(users.id, user.id));

  await cancelPendingNurture(user.id);

  console.log("[chatwoot-webhook] db update:", {
    userId: user.id,
    bundleUsed: true,
    depositTotal: depositTotal > 0 ? depositTotal : user.depositTotal,
    depositAmountUsd: amount,
  });

  await db.insert(events).values({
    userId: user.id,
    telegramId: user.telegramId,
    eventType: "deposit_confirmed",
    metadata: {
      conversationId,
      depositAmountUsd: amount,
      source: "chatwoot_webhook",
    },
    country: user.country,
  });

  if (user.voluumCid && process.env.VOLUUM_POSTBACK_URL) {
    const url = voluumPostbackUrl(
      process.env.VOLUUM_POSTBACK_URL,
      user.voluumCid,
      "deposit_confirmed",
    );
    if (url) fetch(url, { method: "GET" }).catch(() => {});
  }
}

/**
 * Persist Chatwoot conversation/contact ids on the user row so the handoff
 * flow can resolve the conversation by primary key instead of walking
 * /contacts/search. Called on message_created, conversation_created, and
 * conversation_updated events arriving on the mini-app inbox.
 */
async function linkConversationToUser(
  telegramId: number,
  conversationId: string,
  contactId: number | null,
  inboxId: number | null,
): Promise<void> {
  try {
    const [match] = await db
      .select()
      .from(users)
      .where(eq(users.telegramId, telegramId))
      .limit(1);
    if (!match) return;

    const miniAppInboxId = process.env.CHATWOOT_MINIAPP_INBOX_ID
      ? parseInt(process.env.CHATWOOT_MINIAPP_INBOX_ID, 10)
      : null;
    const isFromMiniAppInbox =
      miniAppInboxId != null &&
      Number.isFinite(miniAppInboxId) &&
      inboxId === miniAppInboxId;
    const userHasNoConversation = !match.chatwootConversationId;

    if (!userHasNoConversation && !isFromMiniAppInbox) {
      console.log(
        "[chatwoot-webhook] skip overwrite — existing conversation from mini app inbox takes priority",
      );
      return;
    }

    const updates: Partial<typeof users.$inferInsert> = {
      chatwootConversationId: conversationId,
    };
    if (contactId != null) {
      updates.chatwootContactId = String(contactId);
    }

    await db.update(users).set(updates).where(eq(users.id, match.id));

    console.log("[chatwoot-webhook] linked user to chatwoot conversation", {
      telegramId,
      conversationId,
      contactId,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("Chatwoot webhook link error:", msg);
  }
}

function conversationHasContextFlag(
  conversation: Record<string, unknown> | undefined,
): boolean {
  if (!conversation) return false;
  const custom = conversation.custom_attributes as
    | Record<string, unknown>
    | undefined;
  const additional = conversation.additional_attributes as
    | Record<string, unknown>
    | undefined;
  return (
    custom?.mini_app_context_attached === true ||
    additional?.mini_app_context_attached === true
  );
}

async function handleReturningUserNote(
  payload: Record<string, unknown>,
): Promise<void> {
  const telegramId = extractTelegramId(payload);
  if (!telegramId) return;

  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.telegramId, telegramId))
    .limit(1);

  if (!user || !user.miniAppUser) return;

  const conversationId = extractConversationId(payload);
  if (!conversationId) return;

  const conversation = getConversation(payload);
  if (conversationHasContextFlag(conversation)) {
    console.log("[chatwoot-webhook] context already attached");
    return;
  }

  const latest = await getLatestQuestionnaireAnswers(user.id);
  const daysSince = Math.floor(
    (Date.now() - new Date(user.createdAt!).getTime()) / (1000 * 60 * 60 * 24),
  );

  const note = [
    `⚡ RETURNING MINI APP USER`,
    ``,
    `Originally qualified: ${daysSince} days ago`,
    `Score at entry: ${user.score} (${user.segment})`,
    `Capital declared: ${latest?.capital ?? "see DB"}`,
    `Entry variant: ${user.entryVariant || "unknown"}`,
    `Source CID: ${user.voluumCid || "none"}`,
    `Products owned: ${user.productsUnlocked?.join(", ") || "none"}`,
    `Bundle eligible: ${user.bundleEligible && !user.bundleUsed ? "YES — first deposit" : "NO"}`,
  ].join("\n");

  await addChatwootNote(conversationId, note);
  await setConversationCustomAttribute(
    conversationId,
    "mini_app_context_attached",
    true,
  );
  console.log("[chatwoot-webhook] context note attached");
}

export async function POST(req: NextRequest) {
  const secret = req.nextUrl.searchParams.get("secret");
  const expectedSecret = process.env.CHATWOOT_WEBHOOK_SECRET ?? "";

  if (expectedSecret && secret !== expectedSecret) {
    console.warn("[chatwoot-webhook] Unauthorized request rejected");
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const payload = (await req.json()) as Record<string, unknown>;
    const event = String(payload.event || "");

    const conversation = getConversation(payload);
    const conversationId = extractConversationId(payload);
    const inboxIdRaw =
      (conversation?.inbox_id as number | undefined) ??
      ((payload as Record<string, unknown>).inbox_id as number | undefined) ??
      ((payload.inbox as Record<string, unknown> | undefined)?.id as
        | number
        | undefined) ??
      null;
    const inboxId =
      inboxIdRaw != null && Number.isFinite(Number(inboxIdRaw))
        ? Number(inboxIdRaw)
        : null;
    const labels = collectLabelTitles(conversation);
    const meta = payload.meta as Record<string, unknown> | undefined;
    const sender = (meta?.sender ??
      (payload.sender as Record<string, unknown>)) as
      | Record<string, unknown>
      | undefined;
    const contactId =
      (sender?.id as number | undefined) ??
      ((conversation?.meta as Record<string, unknown> | undefined)?.[
        "sender"
      ] as Record<string, unknown> | undefined)?.id ??
      null;
    const telegramId = extractTelegramId(payload);
    const depositConfirmed = conversationHasDepositConfirmedLabel(labels);

    console.log("[chatwoot-webhook]", {
      event,
      conversationId,
      labels,
      inboxId,
      contactId,
      telegramId,
      depositConfirmed,
    });

    // TEMPORARY DEBUG — remove once telegramId is consistently non-null.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const p = payload as any;
    console.log("[chatwoot-webhook] telegram raw candidates", {
      conversationContactInboxSourceId:
        p?.conversation?.contact_inbox?.source_id,
      rootContactInboxSourceId: p?.contact_inbox?.source_id,
      nestedMessageSourceId:
        p?.conversation?.messages?.[0]?.conversation?.contact_inbox?.source_id,
      metaSocialTelegramUserId:
        p?.conversation?.meta?.sender?.additional_attributes
          ?.social_telegram_user_id,
      senderSocialTelegramUserId:
        p?.sender?.additional_attributes?.social_telegram_user_id,
      messageSenderSocialTelegramUserId:
        p?.conversation?.messages?.[0]?.sender?.additional_attributes
          ?.social_telegram_user_id,
      rootChatId: p?.additional_attributes?.chat_id,
      conversationChatId: p?.conversation?.additional_attributes?.chat_id,
    });

    // Rule 1 — ignore private notes (incl. the ones we post ourselves).
    const message = payload.message as Record<string, unknown> | undefined;
    const isPrivate =
      payload.private === true || message?.private === true;
    if (isPrivate) {
      console.log("[chatwoot-webhook] skip private note");
      return NextResponse.json({ ok: true });
    }

    // Rule 2 — ignore outgoing messages, except when we still need the
    // conversation_updated event for label syncing (handled below).
    const messageType = payload.message_type ?? message?.message_type;
    const isOutgoing = messageType === "outgoing" || messageType === 1;
    if (isOutgoing && event !== "conversation_updated") {
      // Before skipping — check if deposit-confirmed label is present.
      // Chatwoot sometimes fires message_created (outgoing) instead of
      // conversation_updated when a label is applied. Handle it here.
      const outgoingLabels = collectLabelTitles(getConversation(payload));
      if (conversationHasDepositConfirmedLabel(outgoingLabels)) {
        console.log("[chatwoot-webhook] deposit-confirmed on outgoing message — processing");
        await handleDepositConfirmed(payload);
        return NextResponse.json({ ok: true });
      }
      console.log("[chatwoot-webhook] skip outgoing message");
      return NextResponse.json({ ok: true });
    }

    // Mini-app inbox filter — env var is required; events from other inboxes
    // are skipped. Events with no inbox_id in the payload fall through so we
    // do not lose mini-app conversations whose shape omits it.
    const miniappInboxRaw = process.env.CHATWOOT_MINIAPP_INBOX_ID;
    const miniAppInboxId = miniappInboxRaw
      ? parseInt(miniappInboxRaw, 10)
      : null;

    if (!miniAppInboxId || !Number.isFinite(miniAppInboxId)) {
      console.warn("[chatwoot-webhook] CHATWOOT_MINIAPP_INBOX_ID not set");
      return NextResponse.json({ ok: true });
    }

    if (inboxId !== null && inboxId !== miniAppInboxId) {
      console.log(`[chatwoot-webhook] skip non-miniapp inbox ${inboxId}`);
      return NextResponse.json({ ok: true });
    }

    // Persist the chatwoot conversation/contact ids on the mini-app user row
    // so the handoff can use them directly without doing /contacts/search.
    if (
      telegramId != null &&
      conversationId != null &&
      (event === "message_created" ||
        event === "conversation_created" ||
        event === "conversation_updated")
    ) {
      await linkConversationToUser(
        telegramId,
        conversationId,
        typeof contactId === "number" ? contactId : null,
        inboxId,
      );
    }

    if (
      event === "conversation_updated" ||
      event === "conversation_status_changed"
    ) {
      await handleDepositConfirmed(payload);
      return NextResponse.json({ ok: true });
    }

    if (!["conversation_created", "message_created"].includes(event)) {
      return NextResponse.json({ ok: true });
    }

    await handleReturningUserNote(payload);

    return NextResponse.json({ ok: true });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("Chatwoot webhook error:", message);
    return NextResponse.json({ ok: true });
  }
}
