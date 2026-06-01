import { db } from "@/lib/db";
import {
  users,
  events,
  broadcastOffers,
  questionnaireAnswers,
} from "@/lib/db/schema";
import { eq, and, desc, isNull } from "drizzle-orm";
import { getLatestQuestionnaireAnswers } from "@/lib/db/questionnaire";
import { getProductMatch, type ProductKey } from "@/lib/productMatch";
import {
  buildQualifiedLeadCardText,
  capitalFromAnswers,
} from "@/lib/leadCardContent";
import {
  addChatwootNote,
  applyTelegramInboxPriorityLabel,
  findLatestConversationIdForTelegramUser,
  findTelegramInboxConversationForContact,
} from "@/lib/chatwoot";
import { telegramSendMessage } from "@/lib/telegramBotApi";
import {
  attachInternalLeadToChatwoot,
  sendHighIntentTelegramLead,
  fireCrmVoluumPostback,
  buildLeadExtrasFromState,
} from "@/lib/handoffHighIntent";
import { scheduleHighNurture } from "@/lib/nurtureSchedule";
import type { InferSelectModel } from "drizzle-orm";

type UserRow = InferSelectModel<typeof users>;
type AnswerRow = InferSelectModel<typeof questionnaireAnswers> | null;

export function parseReactivateOfferId(
  startParam?: string | null,
): string | null {
  if (!startParam?.startsWith("reactivate_")) return null;
  const id = startParam.slice("reactivate_".length).trim();
  return id || null;
}

export async function loadActiveOfferForUser(offerId: string, userId: string) {
  const [o] = await db
    .select()
    .from(broadcastOffers)
    .where(
      and(
        eq(broadcastOffers.id, offerId),
        eq(broadcastOffers.userId, userId),
      ),
    )
    .limit(1);
  if (!o || o.claimed) return null;
  if (new Date(o.expiresAt) <= new Date()) return null;
  return o;
}

export async function claimBroadcastOffer(offerId: string) {
  await db
    .update(broadcastOffers)
    .set({ claimed: true })
    .where(eq(broadcastOffers.id, offerId));
}

export async function updateLatestQuestionnaireCapital(
  userId: string,
  capital: "under_100" | "100_300" | "300_1000" | "1000_plus",
) {
  const [latest] = await db
    .select()
    .from(questionnaireAnswers)
    .where(eq(questionnaireAnswers.userId, userId))
    .orderBy(desc(questionnaireAnswers.createdAt))
    .limit(1);
  if (!latest) return false;
  await db
    .update(questionnaireAnswers)
    .set({ capital })
    .where(eq(questionnaireAnswers.id, latest.id));
  return true;
}

function parseStoredContactId(raw: string | null | undefined): number | null {
  if (raw == null) return null;
  const trimmed = String(raw).trim();
  if (!trimmed) return null;
  const n = Number(trimmed);
  return Number.isFinite(n) ? n : null;
}

async function resolveTelegramInboxConversationForUser(
  user: UserRow,
): Promise<string | null> {
  if (user.chatwootTelegramConversationId) {
    return user.chatwootTelegramConversationId;
  }
  const contactId = parseStoredContactId(user.chatwootContactId);
  if (contactId == null) return null;
  return findTelegramInboxConversationForContact(contactId);
}

/**
 * Build the same reactivation lead card content used for the API inbox 976
 * post, sourced entirely from persisted user state so the webhook drainer
 * (which has no original `extras` object) can rebuild the identical content.
 */
export function buildReactivationLeadCardContent(
  user: UserRow,
  answers: AnswerRow,
): string {
  const baseExtras = buildLeadExtrasFromState({
    capital: answers?.capital,
    bundleEligible: user.bundleEligible ?? false,
    bundleUsed: user.bundleUsed ?? false,
    bundleAccepted: user.bundleAccepted ?? null,
    bundleOfferShown: user.bundleOfferShown ?? false,
  });
  const extras = { ...baseExtras, reactivation: true as const };
  return buildQualifiedLeadCardText(user, answers, extras);
}

export type ReactivationTelegramPostResult =
  | { status: "posted"; conversationId: string }
  | { status: "skip_already_posted" }
  | { status: "pending_no_conv" }
  | { status: "post_failed" };

/**
 * Atomically claim the per-offer idempotency lock on the broadcast_offers
 * row, then post the reactivation lead card into the Chatwoot Telegram inbox
 * (977). When no 977 conversation exists yet, rolls the lock back to NULL so
 * the webhook handler can post the card the next time the user sends an
 * inbound Telegram message.
 *
 * Caller MUST already have posted the same content to inbox 976 — this
 * helper is responsible only for the 977 mirror.
 */
export async function tryPostReactivationCardToTelegramInbox(args: {
  user: UserRow;
  offerId: string;
  content: string;
}): Promise<ReactivationTelegramPostResult> {
  const { user, offerId, content } = args;

  // Idempotency lock: only the first concurrent caller flips the timestamp
  // from NULL. A returning array of zero rows means another caller already
  // owns the post (or has posted it).
  const claim = await db
    .update(broadcastOffers)
    .set({ chatwootReactivationCardPostedAt: new Date() })
    .where(
      and(
        eq(broadcastOffers.id, offerId),
        eq(broadcastOffers.userId, user.id),
        isNull(broadcastOffers.chatwootReactivationCardPostedAt),
      ),
    )
    .returning({ id: broadcastOffers.id });

  if (claim.length === 0) {
    console.log(
      `[reactivate] telegram inbox card already claimed for offer ${offerId} — skip`,
    );
    return { status: "skip_already_posted" };
  }

  const conversationId = await resolveTelegramInboxConversationForUser(user);

  if (!conversationId) {
    // No 977 conversation yet. Roll back the lock so the webhook drainer
    // can post the card after the next inbound Telegram message arrives.
    await db
      .update(broadcastOffers)
      .set({ chatwootReactivationCardPostedAt: null })
      .where(eq(broadcastOffers.id, offerId));
    console.log(
      `[reactivate] no 977 conversation for user ${user.id}; offer ${offerId} reactivation card pending webhook drain`,
    );
    return { status: "pending_no_conv" };
  }

  try {
    await addChatwootNote(conversationId, content);
    console.log(
      `[reactivate] telegram inbox reactivation card posted to ${conversationId} for offer ${offerId}`,
    );
    await applyTelegramInboxPriorityLabel(conversationId);
    return { status: "posted", conversationId };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error(
      `[reactivate] telegram inbox reactivation card post failed for offer ${offerId} — rolling back lock:`,
      msg,
    );
    await db
      .update(broadcastOffers)
      .set({ chatwootReactivationCardPostedAt: null })
      .where(eq(broadcastOffers.id, offerId));
    return { status: "post_failed" };
  }
}

/**
 * Webhook drainer entry point. Finds every reactivation-confirmed offer for
 * the user that has not yet had its 977 lead card posted, and posts each
 * one. Designed to run from `handleTelegramInboxEvent` so a freshly created
 * 977 conversation can absorb cards that were pending from one or more
 * earlier reactivation confirmations.
 */
export async function drainPendingReactivationCardsForUser(args: {
  userId: string;
  telegramConversationId: string;
}): Promise<void> {
  const { userId, telegramConversationId } = args;

  const pending = await db
    .select()
    .from(broadcastOffers)
    .where(
      and(
        eq(broadcastOffers.userId, userId),
        eq(broadcastOffers.claimed, true),
        isNull(broadcastOffers.chatwootReactivationCardPostedAt),
      ),
    )
    .orderBy(broadcastOffers.createdAt);

  if (pending.length === 0) return;

  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);
  if (!user) return;

  const answers = await getLatestQuestionnaireAnswers(user.id);
  const content = buildReactivationLeadCardContent(user, answers);

  for (const offer of pending) {
    // Acquire per-offer lock atomically.
    const claim = await db
      .update(broadcastOffers)
      .set({ chatwootReactivationCardPostedAt: new Date() })
      .where(
        and(
          eq(broadcastOffers.id, offer.id),
          isNull(broadcastOffers.chatwootReactivationCardPostedAt),
        ),
      )
      .returning({ id: broadcastOffers.id });

    if (claim.length === 0) {
      console.log(
        `[reactivate] drain: offer ${offer.id} already claimed by parallel webhook — skip`,
      );
      continue;
    }

    try {
      await addChatwootNote(telegramConversationId, content);
      console.log(
        `[reactivate] drain: telegram inbox reactivation card posted to ${telegramConversationId} for offer ${offer.id}`,
      );
      await applyTelegramInboxPriorityLabel(telegramConversationId);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error(
        `[reactivate] drain: post failed for offer ${offer.id} — rolling back lock:`,
        msg,
      );
      await db
        .update(broadcastOffers)
        .set({ chatwootReactivationCardPostedAt: null })
        .where(eq(broadcastOffers.id, offer.id));
    }
  }
}

/**
 * After /reactivate READY — Chatwoot note + optional first CRM when user never triggered.
 */
export async function confirmReactivationHandoff(
  user: UserRow,
  offerId: string | null,
): Promise<{ ok: true } | { ok: false; error: string }> {
  if (user.bundleUsed) {
    return { ok: false, error: "already_deposited" };
  }

  const answers = await getLatestQuestionnaireAnswers(user.id);
  const cap = capitalFromAnswers(answers?.capital);
  const pm = getProductMatch(
    cap,
    user.bundleEligible ?? false,
    user.bundleUsed ?? false,
  );

  const extras = {
    ...buildLeadExtrasFromState({
      capital: answers?.capital,
      bundleEligible: user.bundleEligible ?? false,
      bundleUsed: user.bundleUsed ?? false,
      bundleAccepted: user.bundleAccepted ?? null,
      bundleOfferShown: user.bundleOfferShown ?? false,
    }),
    reactivation: true as const,
  };

  const reactivationCardContent = buildQualifiedLeadCardText(
    user,
    answers,
    extras,
  );

  if (user.crmTriggered) {
    // Existing API inbox (976) reactivation lead-card post — DO NOT modify.
    const conversationId =
      (await findLatestConversationIdForTelegramUser(user.telegramId)) ??
      user.chatwootConversationId;
    if (conversationId) {
      await addChatwootNote(conversationId, reactivationCardContent);
    }
    await telegramSendMessage(
      user.telegramId,
      `✅ Your specialist has been notified that you're ready to continue — they'll pick this up in this chat.`,
      { parse_mode: "Markdown" },
    );
  } else {
    const conversationId = await attachInternalLeadToChatwoot(
      user.telegramId,
      pm.productKey as ProductKey,
      user,
      answers,
      extras,
    );
    if (!conversationId) {
      console.log(
        "[handoff] Chatwoot fallback (reactivation) — sending direct Telegram DM",
      );
      await sendHighIntentTelegramLead(user, answers, extras);
    }
    const now = new Date();
    await db
      .update(users)
      .set({
        crmTriggered: true,
        crmTriggeredAt: now,
        intentConfirmedAt: user.intentConfirmedAt ?? now,
        confirmedProductKey: user.confirmedProductKey ?? pm.productKey,
        chatwootConversationId:
          conversationId ?? user.chatwootConversationId,
      })
      .where(eq(users.id, user.id));

    await db.insert(events).values({
      userId: user.id,
      telegramId: user.telegramId,
      eventType: "crm_triggered",
      metadata: {
        score: user.score,
        segment: user.segment,
        source: "reactivation_mini_app",
        productKey: pm.productKey,
      },
      country: user.country,
    });

    await fireCrmVoluumPostback(user.voluumCid);

    if (user.segment === "HIGH") {
      await scheduleHighNurture(user.id, user.telegramId, now);
    }
  }

  if (offerId) {
    await claimBroadcastOffer(offerId);
  }

  await db.insert(events).values({
    userId: user.id,
    telegramId: user.telegramId,
    eventType: "reactivation_confirm",
    metadata: { offerId },
    country: user.country,
  });

  // Mirror the same reactivation lead card into the Telegram inbox (977).
  // Per-offer idempotency: the broadcast_offers row's
  // chatwoot_reactivation_card_posted_at column acts as the lock so that
  // duplicate confirm clicks and webhook re-deliveries cannot create
  // duplicate notes. If no 977 conversation exists yet, the helper releases
  // the lock and the webhook drainer posts on the next inbound Telegram
  // message. This MUST run after claimBroadcastOffer so that
  // claimed = true at the time the webhook drainer queries pending offers.
  //
  // Gated on the crmTriggered === true branch only: the
  // crmTriggered === false branch above goes through
  // attachInternalLeadToChatwoot, which already posts the same reactivation
  // lead card into inbox 977 via the initial-summary flow (gated on
  // chatwootTelegramSummaryPostedAt). Running the helper for that branch
  // would produce a duplicate 977 note for the same offer.
  if (user.crmTriggered && offerId) {
    await tryPostReactivationCardToTelegramInbox({
      user,
      offerId,
      content: reactivationCardContent,
    });
  } else if (user.crmTriggered && !offerId) {
    console.log(
      `[reactivate] confirmReactivationHandoff: no offerId for user ${user.id} — skipping 977 reactivation card post (no per-offer dedupe key)`,
    );
  }

  return { ok: true };
}

/** Telegram READY when CRM already fired — lightweight ping (no duplicate Voluum CRM). */
export async function notifyReactivationFromTelegramReady(user: UserRow) {
  if (!user.crmTriggered) return false;
  const answers = await getLatestQuestionnaireAnswers(user.id);
  const extras = {
    ...buildLeadExtrasFromState({
      capital: answers?.capital,
      bundleEligible: user.bundleEligible ?? false,
      bundleUsed: user.bundleUsed ?? false,
      bundleAccepted: user.bundleAccepted ?? null,
      bundleOfferShown: user.bundleOfferShown ?? false,
    }),
    reactivation: true as const,
  };
  const reactivationCardContent = buildQualifiedLeadCardText(
    user,
    answers,
    extras,
  );

  // Existing API inbox (976) reactivation lead-card post — DO NOT modify.
  const conversationId =
    (await findLatestConversationIdForTelegramUser(user.telegramId)) ??
    user.chatwootConversationId;
  if (conversationId) {
    await addChatwootNote(conversationId, reactivationCardContent);
  }

  // Mirror into the Telegram inbox (977). READY has no explicit offerId, so
  // we dedupe against the latest unposted broadcast_offers row for this
  // user. If no broadcast offer row exists, we skip the 977 post (no
  // per-offer dedupe key is available, per spec).
  const [latestPendingOffer] = await db
    .select()
    .from(broadcastOffers)
    .where(
      and(
        eq(broadcastOffers.userId, user.id),
        isNull(broadcastOffers.chatwootReactivationCardPostedAt),
      ),
    )
    .orderBy(desc(broadcastOffers.createdAt))
    .limit(1);

  if (latestPendingOffer) {
    await tryPostReactivationCardToTelegramInbox({
      user,
      offerId: latestPendingOffer.id,
      content: reactivationCardContent,
    });
  } else {
    console.log(
      `[reactivate] notifyReactivationFromTelegramReady: no pending broadcast offer for user ${user.id} — skipping 977 post (no per-offer dedupe key)`,
    );
  }

  await telegramSendMessage(
    user.telegramId,
    `✅ Noted — I've flagged the team that you're *READY* to continue.`,
    { parse_mode: "Markdown" },
  );
  // broadcast_reply for Telegram READY is logged once in bot/handlers/messages.ts
  // before this path runs, to avoid duplicate attribution events.
  return true;
}
