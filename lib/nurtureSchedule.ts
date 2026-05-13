import { db } from "@/lib/db";
import { nurtureQueue } from "@/lib/db/schema";
import { and, eq } from "drizzle-orm";
import { assignVariant } from "@/lib/reEngagementBroadcasts";

export const HIGH_REACTIVATION_TYPES = [
  "reactivation_48h",
  "reactivation_day5",
  "high_to_mid_day14",
] as const;

export async function hasPendingHighReactivation(userId: string) {
  const rows = await db
    .select({ id: nurtureQueue.id })
    .from(nurtureQueue)
    .where(
      and(
        eq(nurtureQueue.userId, userId),
        eq(nurtureQueue.status, "pending"),
        eq(nurtureQueue.broadcastType, "reactivation_48h"),
      ),
    )
    .limit(1);
  return rows.length > 0;
}

/** From first CRM handoff / READY — 48h, day 5, day 14 HIGH→MID reclass. */
export async function scheduleHighReactivationNurture(
  userId: string,
  telegramId: number,
  from: Date,
) {
  if (await hasPendingHighReactivation(userId)) return;

  const ms = from.getTime();
  const rows = [
    {
      userId,
      telegramId,
      step: 0,
      scheduledAt: new Date(ms + 48 * 60 * 60 * 1000),
      status: "pending" as const,
      nurtureKind: "mid",
      broadcastType: "reactivation_48h",
      messageVariant: assignVariant(),
    },
    {
      userId,
      telegramId,
      step: 1,
      scheduledAt: new Date(ms + 5 * 24 * 60 * 60 * 1000),
      status: "pending" as const,
      nurtureKind: "mid",
      broadcastType: "reactivation_day5",
      messageVariant: assignVariant(),
    },
    {
      userId,
      telegramId,
      step: 2,
      scheduledAt: new Date(ms + 14 * 24 * 60 * 60 * 1000),
      status: "pending" as const,
      nurtureKind: "mid",
      broadcastType: "high_to_mid_day14",
      messageVariant: assignVariant(),
    },
  ];
  await db.insert(nurtureQueue).values(rows);
}

/** MID extended sequence from questionnaire completion anchor. */
export async function scheduleMidExtendedNurture(
  userId: string,
  telegramId: number,
  from: Date,
) {
  const ms = from.getTime();
  const rows = [
    {
      userId,
      telegramId,
      step: 3,
      scheduledAt: new Date(ms + 7 * 24 * 60 * 60 * 1000),
      status: "pending" as const,
      nurtureKind: "mid",
      broadcastType: "mid_day7",
      messageVariant: assignVariant(),
    },
    {
      userId,
      telegramId,
      step: 4,
      scheduledAt: new Date(ms + 14 * 24 * 60 * 60 * 1000),
      status: "pending" as const,
      nurtureKind: "mid",
      broadcastType: "mid_day14",
      messageVariant: assignVariant(),
    },
    {
      userId,
      telegramId,
      step: 5,
      scheduledAt: new Date(ms + 21 * 24 * 60 * 60 * 1000),
      status: "pending" as const,
      nurtureKind: "mid",
      broadcastType: "mid_day21",
      messageVariant: assignVariant(),
    },
  ];
  await db.insert(nurtureQueue).values(rows);
}

export async function scheduleLowDay14(
  userId: string,
  telegramId: number,
  from: Date,
) {
  const ms = from.getTime();
  await db.insert(nurtureQueue).values({
    userId,
    telegramId,
    step: 0,
    scheduledAt: new Date(ms + 14 * 24 * 60 * 60 * 1000),
    status: "pending",
    nurtureKind: "mid",
    broadcastType: "low_day14",
    messageVariant: assignVariant(),
  });
}

export async function scheduleLowDay30FromNow(
  userId: string,
  telegramId: number,
) {
  const from = new Date();
  await db.insert(nurtureQueue).values({
    userId,
    telegramId,
    step: 1,
    scheduledAt: new Date(from.getTime() + 14 * 24 * 60 * 60 * 1000),
    status: "pending",
    nurtureKind: "mid",
    broadcastType: "low_day30",
    messageVariant: assignVariant(),
  });
}

/** After HIGH→MID at day 14 — next MID touchpoint. */
export async function scheduleMidDay7AfterReclass(
  userId: string,
  telegramId: number,
  from: Date,
) {
  await db.insert(nurtureQueue).values({
    userId,
    telegramId,
    step: 3,
    scheduledAt: new Date(from.getTime() + 7 * 24 * 60 * 60 * 1000),
    status: "pending",
    nurtureKind: "mid",
    broadcastType: "mid_day7",
    messageVariant: assignVariant(),
  });
}
