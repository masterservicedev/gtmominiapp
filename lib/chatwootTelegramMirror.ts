import { db } from "@/lib/db";
import { events, users } from "@/lib/db/schema";
import { and, desc, eq, sql } from "drizzle-orm";
import type { InferSelectModel } from "drizzle-orm";
import {
  addChatwootNote,
  applyTelegramInboxPriorityLabel,
  resolveTelegramInbox977ConversationId,
} from "@/lib/chatwoot";
import { getLatestQuestionnaireAnswers } from "@/lib/db/questionnaire";
import { buildQualifiedLeadCardText } from "@/lib/leadCardContent";
import { applyTelegramInbox977Triage, removeStaleTelegramInboxTriageLabels } from "@/lib/chatwootInboxTriage";
import { getProductMatch } from "@/lib/productMatch";
import { capitalFromAnswers, type LeadCardExtras } from "@/lib/leadCardContent";

type UserRow = InferSelectModel<typeof users>;

export const CHATWOOT_TELEGRAM_SUMMARY_MIRROR_EVENT =
  "chatwoot_telegram_summary_posted" as const;

export type TelegramMirrorSource = "handoff" | "webhook" | "init";

export type TelegramMirrorMetadata = {
  apiConversationId: string;
  telegramConversationId: string;
  source: TelegramMirrorSource;
};

const DEFAULT_CHATWOOT_LOOKUP_TIMEOUT_MS = 4000;

function buildLeadExtrasFromState(input: {
  capital: string | undefined;
  bundleEligible: boolean;
  bundleUsed: boolean;
  bundleAccepted: boolean | null;
  bundleOfferShown: boolean;
}): LeadCardExtras {
  const cap = capitalFromAnswers(input.capital);
  const productMatch = getProductMatch(
    cap,
    input.bundleEligible,
    input.bundleUsed,
  );
  return {
    productMatch,
    bundleOfferShown: input.bundleOfferShown,
    bundleAccepted: input.bundleAccepted,
  };
}

function parseStoredContactId(raw: string | null | undefined): number | null {
  if (raw == null) return null;
  const trimmed = String(raw).trim();
  if (!trimmed) return null;
  const n = Number(trimmed);
  return Number.isFinite(n) ? n : null;
}

function withLookupTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number,
): Promise<T | "timeout"> {
  return Promise.race([
    promise,
    new Promise<"timeout">((resolve) => {
      setTimeout(() => resolve("timeout"), timeoutMs);
    }),
  ]);
}

/** True when this API inbox conversation was already mirrored to Telegram inbox 977. */
export async function hasTelegramSummaryMirrorForApiConversation(
  userId: string,
  apiConversationId: string,
): Promise<boolean> {
  const apiId = String(apiConversationId);
  const [row] = await db
    .select({ id: events.id })
    .from(events)
    .where(
      and(
        eq(events.userId, userId),
        eq(events.eventType, CHATWOOT_TELEGRAM_SUMMARY_MIRROR_EVENT),
        sql`${events.metadata}->>'apiConversationId' = ${apiId}`,
      ),
    )
    .limit(1);
  return row != null;
}

/**
 * Latest API inbox conversation id that does not yet have a mirror event.
 * Prefers `users.chatwoot_api_conversation_id`, then `handoff_confirmed` events.
 */
export async function findLatestUnmirroredApiConversationId(
  user: UserRow,
): Promise<string | null> {
  const candidates: string[] = [];
  const fromUser =
    user.chatwootApiConversationId ?? user.chatwootConversationId ?? null;
  if (fromUser) candidates.push(String(fromUser));

  const handoffs = await db
    .select({ metadata: events.metadata })
    .from(events)
    .where(
      and(
        eq(events.userId, user.id),
        eq(events.eventType, "handoff_confirmed"),
      ),
    )
    .orderBy(desc(events.createdAt))
    .limit(20);

  for (const row of handoffs) {
    const meta = row.metadata as { conversationId?: string | null } | null;
    const id = meta?.conversationId;
    if (id) {
      const s = String(id);
      if (!candidates.includes(s)) candidates.push(s);
    }
  }

  for (const apiConversationId of candidates) {
    if (
      !(await hasTelegramSummaryMirrorForApiConversation(
        user.id,
        apiConversationId,
      ))
    ) {
      return apiConversationId;
    }
  }
  return null;
}

export type MirrorLeadCardResult =
  | "posted"
  | "already_mirrored"
  | "post_failed";

/**
 * Mirror a 976 lead card to Telegram inbox 977 once per API conversation.
 * `users.chatwoot_telegram_summary_posted_at` is updated as last-mirrored only.
 */
export async function mirrorLeadCardToTelegramInbox(args: {
  userId: string;
  telegramId: number;
  apiConversationId: string;
  telegramConversationId: string;
  content: string;
  source: TelegramMirrorSource;
  country?: string | null;
}): Promise<MirrorLeadCardResult> {
  const apiId = String(args.apiConversationId);
  const telegramConvId = String(args.telegramConversationId);

  if (await hasTelegramSummaryMirrorForApiConversation(args.userId, apiId)) {
    await applyTelegramInboxPriorityLabel(telegramConvId);
    await removeStaleTelegramInboxTriageLabels(telegramConvId);
    console.log(
      "[handoff] telegram mirror already recorded for api conversation — priority ensured",
      { apiConversationId: apiId, telegramConversationId: telegramConvId },
    );
    return "already_mirrored";
  }

  const noteOk = await addChatwootNote(telegramConvId, args.content);
  if (!noteOk) {
    console.error(
      "[handoff] telegram inbox mirror note failed — not recording mirror (will retry on next inbound)",
      { apiConversationId: apiId, telegramConversationId: telegramConvId },
    );
    return "post_failed";
  }
  await applyTelegramInboxPriorityLabel(telegramConvId);
  await removeStaleTelegramInboxTriageLabels(telegramConvId);

  await db.insert(events).values({
    userId: args.userId,
    telegramId: args.telegramId,
    eventType: CHATWOOT_TELEGRAM_SUMMARY_MIRROR_EVENT,
    metadata: {
      apiConversationId: apiId,
      telegramConversationId: telegramConvId,
      source: args.source,
    } satisfies TelegramMirrorMetadata,
    country: args.country ?? null,
  });

  await db
    .update(users)
    .set({
      chatwootTelegramConversationId: telegramConvId,
      chatwootTelegramSummaryPostedAt: new Date(),
    })
    .where(eq(users.id, args.userId));

  console.log("[handoff] telegram inbox lead card mirrored", {
    apiConversationId: apiId,
    telegramConversationId: telegramConvId,
    source: args.source,
  });

  return "posted";
}

/** Post any unmirrored 976 lead card to a verified Telegram inbox conversation. */
export async function tryDeliverPendingTelegram977Mirror(
  user: UserRow,
  telegramConversationId: string,
  source: TelegramMirrorSource,
  options?: { webhookContextVerified?: boolean },
): Promise<void> {
  let mirrorConversationId = telegramConversationId;
  if (options?.webhookContextVerified === true) {
    const resolved = await resolveTelegramInbox977ConversationId({
      telegramId: user.telegramId,
      storedConversationId: user.chatwootTelegramConversationId,
      webhookConversationId: telegramConversationId,
      webhookContextVerified: true,
      canonicalContactId: parseStoredContactId(user.chatwootContactId),
    });
    if (!resolved.conversationId) {
      console.log(
        "[chatwoot-977] webhook mirror skipped — no verified 977 conversation",
        {
          userId: user.id,
          telegramId: user.telegramId,
          incomingConversationId: telegramConversationId,
        },
      );
      return;
    }
    mirrorConversationId = resolved.conversationId;
  }

  const apiConversationId = await findLatestUnmirroredApiConversationId(user);
  if (!apiConversationId) {
    console.log(
      `[chatwoot-977] no unmirrored api conversation for user ${user.id} — skip mirror`,
    );
    return;
  }

  const answers = await getLatestQuestionnaireAnswers(user.id);
  const extras = buildLeadExtrasFromState({
    capital: answers?.capital,
    bundleEligible: user.bundleEligible ?? false,
    bundleUsed: user.bundleUsed ?? false,
    bundleAccepted: user.bundleAccepted ?? null,
    bundleOfferShown: user.bundleOfferShown ?? false,
  });
  const content = buildQualifiedLeadCardText(user, answers, extras);

  await mirrorLeadCardToTelegramInbox({
    userId: user.id,
    telegramId: user.telegramId,
    apiConversationId,
    telegramConversationId: mirrorConversationId,
    content,
    source,
    country: user.country,
  });
}

async function resolveTelegramInboxConversationForMirror(args: {
  user: UserRow;
  contactId: number;
  webhookConversationId?: string | null;
}): Promise<string | null> {
  const resolved = await resolveTelegramInbox977ConversationId({
    telegramId: args.user.telegramId,
    storedConversationId: args.user.chatwootTelegramConversationId,
    webhookConversationId: args.webhookConversationId,
    canonicalContactId: args.contactId,
  });
  if (resolved.conversationId) {
    console.log("[chatwoot-977] mirror resolver", {
      telegramId: args.user.telegramId,
      conversationId: resolved.conversationId,
      source: resolved.source,
    });
  }
  return resolved.conversationId;
}

/** Immediate mirror at handoff when a 977 conversation already exists. */
export async function maybePostTelegramInboxSummaryAtHandoff(args: {
  user: UserRow;
  contactId: number;
  apiConversationId: string;
  content: string;
}): Promise<void> {
  const telegramConvId = await resolveTelegramInboxConversationForMirror({
    user: args.user,
    contactId: args.contactId,
  });
  if (!telegramConvId) {
    console.log(
      "[handoff] no telegram inbox conversation yet — webhook will mirror on first inbound",
      { apiConversationId: args.apiConversationId },
    );
    return;
  }

  if (!args.user.chatwootTelegramConversationId) {
    await db
      .update(users)
      .set({ chatwootTelegramConversationId: telegramConvId })
      .where(eq(users.id, args.user.id));
  }

  await mirrorLeadCardToTelegramInbox({
    userId: args.user.id,
    telegramId: args.user.telegramId,
    apiConversationId: args.apiConversationId,
    telegramConversationId: telegramConvId,
    content: args.content,
    source: "handoff",
    country: args.user.country,
  });
}

/**
 * Best-effort 977 association after /api/init. Never throws; lookup is timeout-bounded.
 */
export async function associateTelegram977ConversationForUser(args: {
  userId: string;
  webhookConversationId?: string | null;
  timeoutMs?: number;
}): Promise<void> {
  const timeoutMs = args.timeoutMs ?? DEFAULT_CHATWOOT_LOOKUP_TIMEOUT_MS;

  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.id, args.userId))
    .limit(1);
  if (!user) return;

  const lookup = withLookupTimeout(
    resolveTelegramInbox977ConversationId({
      telegramId: user.telegramId,
      storedConversationId: user.chatwootTelegramConversationId,
      webhookConversationId: args.webhookConversationId,
      canonicalContactId: parseStoredContactId(user.chatwootContactId),
    }),
    timeoutMs,
  );

  const resolved = await lookup;
  if (resolved === "timeout") {
    console.warn("[chatwoot-977] init association timed out", {
      userId: user.id,
      telegramId: user.telegramId,
      timeoutMs,
    });
    return;
  }

  if (!resolved.conversationId) {
    console.log("[chatwoot-977] init association found no conversation", {
      userId: user.id,
      telegramId: user.telegramId,
      source: resolved.source,
    });
    return;
  }

  if (user.chatwootTelegramConversationId !== resolved.conversationId) {
    await db
      .update(users)
      .set({ chatwootTelegramConversationId: resolved.conversationId })
      .where(eq(users.id, user.id));
  }

  console.log("[chatwoot-977] init association persisted", {
    userId: user.id,
    telegramId: user.telegramId,
    conversationId: resolved.conversationId,
    source: resolved.source,
  });

  const [freshUser] = await db
    .select()
    .from(users)
    .where(eq(users.id, user.id))
    .limit(1);
  const triageUser = freshUser ?? user;

  await applyTelegramInbox977Triage({
    conversationId: resolved.conversationId,
    telegramId: triageUser.telegramId,
    user: triageUser,
  });

  if (
    triageUser.intentConfirmedAt != null ||
    triageUser.crmTriggered === true
  ) {
    await tryDeliverPendingTelegram977Mirror(
      triageUser,
      resolved.conversationId,
      "init",
    );
  }
}
