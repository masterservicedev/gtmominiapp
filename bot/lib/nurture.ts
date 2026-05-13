import type { Bot } from "grammy";
import { db } from "./db";
import { nurtureQueue, users, events } from "../../lib/db/schema";
import { eq, lte, and, inArray } from "drizzle-orm";
import type { InferSelectModel } from "drizzle-orm";
import {
  sendLowDay14,
  sendLowDay30Final,
  sendMidDay14,
  sendMidDay21Final,
  sendMidDay7,
  sendReactivation48h,
  sendReactivationDay5,
} from "./broadcasts";
import { scheduleMidDay7AfterReclass } from "../../lib/nurtureSchedule";
import { normalizeMessageVariant } from "../../lib/reEngagementBroadcasts";

type NurtureItem = InferSelectModel<typeof nurtureQueue>;
type UserRow = InferSelectModel<typeof users>;

async function logReEngagementSent(
  user: UserRow,
  item: NurtureItem,
  broadcastType: string,
) {
  await db.insert(events).values({
    userId: user.id,
    telegramId: user.telegramId,
    eventType: "broadcast_sent",
    metadata: {
      broadcastType,
      variant: normalizeMessageVariant(item.messageVariant),
      nurtureQueueId: String(item.id),
    },
    country: user.country,
  });
}

const nurtureMessages = [
  (firstName: string) =>
    `Hey ${firstName}, you're now inside GTMO Trading signals.\n\nThe channel is live every day with real trade setups. Have a look around and see what we're doing. 👀`,

  (firstName: string) =>
    `${firstName}, just checking in.\n\nIf you've been watching the channel, you'll have seen the kind of setups we run. When you're ready to go deeper, tap below to get started with a funded account. 📈`,

  (firstName: string) =>
    `Last message from us for now, ${firstName}.\n\nIf the timing is right and you're ready to start — our team is available to walk you through everything step by step.\n\nReply *READY* and we'll connect you now.`,
];

const intentDeclineNurtureMessages = [
  (firstName: string) =>
    `Hi ${firstName},\n\nYou weren't ready to connect with a specialist yet — totally fine.\n\nStay in the free channel and watch how we trade live. When timing feels right, open the mini app again and we can pick up where you left off.`,

  (firstName: string) =>
    `${firstName}, quick follow-up.\n\nIf your situation has changed and you'd like to explore funding + the offer we showed you, just open the app and continue from there. 📲`,

  (firstName: string) =>
    `Last nudge from me, ${firstName}.\n\nIf you want a specialist to walk you through the next step, reply *READY* here or reopen the mini app when you're ready.`,
];

async function cancelQueueItem(id: string) {
  await db
    .update(nurtureQueue)
    .set({ status: "cancelled" })
    .where(eq(nurtureQueue.id, id));
}

async function cancelPendingReactivationEarly(userId: string) {
  await db
    .update(nurtureQueue)
    .set({ status: "cancelled" })
    .where(
      and(
        eq(nurtureQueue.userId, userId),
        eq(nurtureQueue.status, "pending"),
        inArray(nurtureQueue.broadcastType, [
          "reactivation_48h",
          "reactivation_day5",
        ]),
      ),
    );
}

export async function processNurtureQueue(bot: Bot) {
  const now = new Date();

  const pending = await db
    .select()
    .from(nurtureQueue)
    .where(
      and(
        eq(nurtureQueue.status, "pending"),
        lte(nurtureQueue.scheduledAt, now),
      ),
    );

  for (const item of pending) {
    try {
      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.id, item.userId))
        .limit(1);

      if (!user) continue;

      const broadcastType = item.broadcastType ?? "nurture";

      if (
        broadcastType === "nurture" &&
        item.nurtureKind === "mid" &&
        item.step <= 2 &&
        user.crmTriggered
      ) {
        await cancelQueueItem(item.id);
        continue;
      }

      if (item.nurtureKind === "intent_decline" && user.crmTriggered) {
        await cancelQueueItem(item.id);
        continue;
      }

      if (
        ["mid_day7", "mid_day14", "mid_day21"].includes(broadcastType) &&
        user.segment === "HIGH" &&
        user.crmTriggered
      ) {
        await cancelQueueItem(item.id);
        continue;
      }

      if (
        (broadcastType === "reactivation_48h" ||
          broadcastType === "reactivation_day5") &&
        user.bundleUsed
      ) {
        await cancelQueueItem(item.id);
        continue;
      }

      if (broadcastType === "high_to_mid_day14") {
        if (user.bundleUsed) {
          await cancelQueueItem(item.id);
          continue;
        }
        const nowT = new Date();
        await db
          .update(users)
          .set({ segment: "MID" })
          .where(eq(users.id, user.id));
        await cancelPendingReactivationEarly(user.id);
        await scheduleMidDay7AfterReclass(
          user.id,
          user.telegramId,
          nowT,
        );
        await logReEngagementSent(user, item, "high_to_mid_day14");
        await db
          .update(nurtureQueue)
          .set({ status: "sent", sentAt: new Date() })
          .where(eq(nurtureQueue.id, item.id));
        continue;
      }

      if (broadcastType === "reactivation_48h") {
        const v = normalizeMessageVariant(item.messageVariant);
        await sendReactivation48h(bot.api, user, v);
        await logReEngagementSent(user, item, broadcastType);
        await db
          .update(nurtureQueue)
          .set({ status: "sent", sentAt: new Date() })
          .where(eq(nurtureQueue.id, item.id));
        continue;
      }

      if (broadcastType === "reactivation_day5") {
        const v = normalizeMessageVariant(item.messageVariant);
        await sendReactivationDay5(bot.api, user, v);
        await logReEngagementSent(user, item, broadcastType);
        await db
          .update(nurtureQueue)
          .set({ status: "sent", sentAt: new Date() })
          .where(eq(nurtureQueue.id, item.id));
        continue;
      }

      if (broadcastType === "mid_day7") {
        const v = normalizeMessageVariant(item.messageVariant);
        await sendMidDay7(bot.api, user, v);
        await logReEngagementSent(user, item, broadcastType);
        await db
          .update(nurtureQueue)
          .set({ status: "sent", sentAt: new Date() })
          .where(eq(nurtureQueue.id, item.id));
        continue;
      }

      if (broadcastType === "mid_day14") {
        const v = normalizeMessageVariant(item.messageVariant);
        await sendMidDay14(bot.api, user, v);
        await logReEngagementSent(user, item, broadcastType);
        await db
          .update(nurtureQueue)
          .set({ status: "sent", sentAt: new Date() })
          .where(eq(nurtureQueue.id, item.id));
        continue;
      }

      if (broadcastType === "mid_day21") {
        const v = normalizeMessageVariant(item.messageVariant);
        await sendMidDay21Final(bot.api, user, v);
        await db
          .update(users)
          .set({ segment: "LOW" })
          .where(eq(users.id, user.id));
        await logReEngagementSent(user, item, broadcastType);
        await db
          .update(nurtureQueue)
          .set({ status: "sent", sentAt: new Date() })
          .where(eq(nurtureQueue.id, item.id));
        continue;
      }

      if (broadcastType === "low_day14") {
        const v = normalizeMessageVariant(item.messageVariant);
        await sendLowDay14(bot.api, user, v);
        await logReEngagementSent(user, item, broadcastType);
        await db
          .update(nurtureQueue)
          .set({ status: "sent", sentAt: new Date() })
          .where(eq(nurtureQueue.id, item.id));
        continue;
      }

      if (broadcastType === "low_day30") {
        const v = normalizeMessageVariant(item.messageVariant);
        await sendLowDay30Final(bot.api, user, v);
        await logReEngagementSent(user, item, broadcastType);
        await db
          .update(nurtureQueue)
          .set({ status: "sent", sentAt: new Date() })
          .where(eq(nurtureQueue.id, item.id));
        continue;
      }

      const kind = item.nurtureKind ?? "mid";
      const templates =
        kind === "intent_decline" ? intentDeclineNurtureMessages : nurtureMessages;
      const template = templates[item.step];
      if (!template) continue;

      const message = template(user.firstName || "there");

      await bot.api.sendMessage(user.telegramId, message, {
        parse_mode: "Markdown",
      });

      await db
        .update(nurtureQueue)
        .set({ status: "sent", sentAt: new Date() })
        .where(eq(nurtureQueue.id, item.id));
    } catch (err) {
      console.error(`Nurture send failed for ${item.userId}:`, err);
    }
  }
}
