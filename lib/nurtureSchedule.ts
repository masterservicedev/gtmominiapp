import { db } from "@/lib/db";
import { nurtureQueue } from "@/lib/db/schema";
import { and, eq } from "drizzle-orm";

export async function cancelPendingNurture(userId: string) {
  await db
    .update(nurtureQueue)
    .set({ status: "cancelled" })
    .where(
      and(eq(nurtureQueue.userId, userId), eq(nurtureQueue.status, "pending")),
    );
}

/** Schedules for HIGH segment after Chatwoot handoff */
export async function scheduleHighNurture(
  userId: string,
  telegramId: number,
  now: Date,
): Promise<void> {
  await cancelPendingNurture(userId);

  const day2 = new Date(now.getTime() + 48 * 60 * 60 * 1000);
  const day5 = new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000);

  await db.insert(nurtureQueue).values([
    {
      userId,
      telegramId,
      step: 0,
      broadcastType: "high_day2",
      scheduledAt: day2,
      status: "pending",
      messageVariant: "A",
    },
    {
      userId,
      telegramId,
      step: 1,
      broadcastType: "high_day5",
      scheduledAt: day5,
      status: "pending",
      messageVariant: "A",
    },
  ]);
}

/** Schedules for MID segment after questionnaire complete */
export async function scheduleMidNurture(
  userId: string,
  telegramId: number,
  now: Date,
): Promise<void> {
  await cancelPendingNurture(userId);

  const day3 = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);
  const day10 = new Date(now.getTime() + 10 * 24 * 60 * 60 * 1000);

  await db.insert(nurtureQueue).values([
    {
      userId,
      telegramId,
      step: 0,
      broadcastType: "mid_day3",
      scheduledAt: day3,
      status: "pending",
      messageVariant: "A",
    },
    {
      userId,
      telegramId,
      step: 1,
      broadcastType: "mid_day10",
      scheduledAt: day10,
      status: "pending",
      messageVariant: "A",
    },
  ]);
}

/** Schedules for LOW/Starter segment after handoff */
export async function scheduleLowNurture(
  userId: string,
  telegramId: number,
  now: Date,
): Promise<void> {
  await cancelPendingNurture(userId);

  const day7 = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

  await db.insert(nurtureQueue).values({
    userId,
    telegramId,
    step: 0,
    broadcastType: "low_day7",
    scheduledAt: day7,
    status: "pending",
    messageVariant: "A",
  });
}
