import { db } from "@/lib/db";
import {
  users,
  events,
  broadcastOffers,
  questionnaireAnswers,
} from "@/lib/db/schema";
import { eq, and, desc } from "drizzle-orm";
import { getLatestQuestionnaireAnswers } from "@/lib/db/questionnaire";
import { getProductMatch, type ProductKey } from "@/lib/productMatch";
import {
  buildQualifiedLeadCardText,
  capitalFromAnswers,
} from "@/lib/leadCardContent";
import { findLatestConversationIdForTelegramUser } from "@/lib/chatwoot";
import { addChatwootNote } from "@/lib/chatwoot";
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

  if (user.crmTriggered) {
    const conversationId =
      (await findLatestConversationIdForTelegramUser(user.telegramId)) ??
      user.chatwootConversationId;
    if (conversationId) {
      await addChatwootNote(
        conversationId,
        buildQualifiedLeadCardText(user, answers, extras),
      );
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
  const conversationId =
    (await findLatestConversationIdForTelegramUser(user.telegramId)) ??
    user.chatwootConversationId;
  if (conversationId) {
    await addChatwootNote(
      conversationId,
      buildQualifiedLeadCardText(user, answers, extras),
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
