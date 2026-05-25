import type { Bot } from "grammy";
import { db } from "./db";
import { nurtureQueue, users, events } from "../../lib/db/schema";
import { eq, lte, and } from "drizzle-orm";
import {
  sendHighDay2,
  sendHighDay5,
  sendMidDay3,
  sendMidDay10,
  sendLowDay7,
} from "../../lib/reEngagementBroadcasts";

export async function processNurtureQueue(bot: Bot): Promise<void> {
  const now = new Date();

  const pending = await db
    .select()
    .from(nurtureQueue)
    .leftJoin(users, eq(nurtureQueue.userId, users.id))
    .where(
      and(
        eq(nurtureQueue.status, "pending"),
        lte(nurtureQueue.scheduledAt, now),
      ),
    );

  for (const row of pending) {
    const queue = row.nurture_queue;
    const user = row.users;

    if (!user) {
      await db
        .update(nurtureQueue)
        .set({ status: "cancelled" })
        .where(eq(nurtureQueue.id, queue.id));
      continue;
    }

    if (user.bundleUsed) {
      await db
        .update(nurtureQueue)
        .set({ status: "cancelled" })
        .where(eq(nurtureQueue.id, queue.id));
      continue;
    }

    try {
      switch (queue.broadcastType) {
        case "high_day2":
          await sendHighDay2(bot.api, user);
          break;
        case "high_day5":
          await sendHighDay5(bot.api, user);
          break;
        case "mid_day3":
          await sendMidDay3(bot.api, user);
          break;
        case "mid_day10":
          await sendMidDay10(bot.api, user);
          break;
        case "low_day7":
          await sendLowDay7(bot.api, user);
          break;
        default:
          console.warn("[nurture] unknown broadcastType:", queue.broadcastType);
          await db
            .update(nurtureQueue)
            .set({ status: "cancelled" })
            .where(eq(nurtureQueue.id, queue.id));
          continue;
      }

      await db
        .update(nurtureQueue)
        .set({ status: "sent", sentAt: now })
        .where(eq(nurtureQueue.id, queue.id));

      await db.insert(events).values({
        userId: user.id,
        telegramId: user.telegramId,
        eventType: "broadcast_sent",
        metadata: {
          broadcastType: queue.broadcastType,
          nurtureQueueId: queue.id,
        },
        country: user.country,
      });

      console.log(
        `[nurture] sent ${queue.broadcastType} to ${user.telegramId}`,
      );
    } catch (err) {
      console.error(
        `[nurture] failed ${queue.broadcastType} for ${user.telegramId}:`,
        err,
      );

      const newRetryCount = (queue.retryCount ?? 0) + 1;
      const MAX_RETRIES = 3;

      if (newRetryCount >= MAX_RETRIES) {
        await db
          .update(nurtureQueue)
          .set({ status: "failed", retryCount: newRetryCount })
          .where(eq(nurtureQueue.id, queue.id));
        console.log(
          `[nurture] marked as failed after ${MAX_RETRIES} attempts: ${queue.id}`,
        );
      } else {
        await db
          .update(nurtureQueue)
          .set({ retryCount: newRetryCount })
          .where(eq(nurtureQueue.id, queue.id));
        console.log(
          `[nurture] retry ${newRetryCount}/${MAX_RETRIES} for ${queue.id}`,
        );
      }
    }
  }
}
