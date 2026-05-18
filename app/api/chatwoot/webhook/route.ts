import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { users, events } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import {
  addChatwootNote,
  setConversationCustomAttribute,
} from "@/lib/chatwoot";
import { getLatestQuestionnaireAnswers } from "@/lib/db/questionnaire";
import { voluumPostbackUrl } from "@/lib/voluum";
import {
  collectLabelTitles,
  conversationHasDepositConfirmedLabel,
  extractDepositAmountUsd,
} from "@/lib/chatwootDeposit";

function getPath(obj: unknown, path: (string | number)[]): unknown {
  let cur: unknown = obj;
  for (const key of path) {
    if (cur == null || typeof cur !== "object") return undefined;
    cur = (cur as Record<string | number, unknown>)[key];
  }
  return cur;
}

function extractTelegramId(payload: Record<string, unknown>): number | null {
  const candidates: unknown[] = [
    // Canonical paths from Chatwoot Telegram webhooks.
    getPath(payload, ["conversation", "contact_inbox", "source_id"]),
    getPath(payload, [
      "conversation",
      "messages",
      0,
      "conversation",
      "contact_inbox",
      "source_id",
    ]),
    getPath(payload, [
      "conversation",
      "meta",
      "sender",
      "additional_attributes",
      "social_telegram_user_id",
    ]),
    getPath(payload, [
      "contact",
      "additional_attributes",
      "social_telegram_user_id",
    ]),
    getPath(payload, [
      "sender",
      "additional_attributes",
      "social_telegram_user_id",
    ]),

    // Legacy / less-specific paths kept as final fallback.
    getPath(payload, ["meta", "sender", "identifier"]),
    getPath(payload, ["sender", "identifier"]),
  ];

  for (const raw of candidates) {
    if (raw == null) continue;
    if (typeof raw !== "string" && typeof raw !== "number") continue;
    const n = Number(raw);
    if (Number.isFinite(n) && n > 0) return n;
  }
  return null;
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

  const [byConv] = await db
    .select()
    .from(users)
    .where(eq(users.chatwootConversationId, conversationId))
    .limit(1);

  let user = byConv;
  let matchedBy: "conversationId" | "telegramId" | null = byConv
    ? "conversationId"
    : null;
  if (!user && telegramId != null) {
    const [byTg] = await db
      .select()
      .from(users)
      .where(eq(users.telegramId, telegramId))
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

  const titles = collectLabelTitles(conversation);
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
  try {
    const payload = (await req.json()) as Record<string, unknown>;
    const event = String(payload.event || "");

    const conversation = getConversation(payload);
    const conversationId = extractConversationId(payload);
    const inboxId =
      (conversation?.inbox_id as number | undefined) ??
      ((payload.inbox as Record<string, unknown> | undefined)?.id as
        | number
        | undefined) ??
      null;
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
      console.log("[chatwoot-webhook] skip outgoing message");
      return NextResponse.json({ ok: true });
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
