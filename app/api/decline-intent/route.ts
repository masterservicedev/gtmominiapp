import { NextRequest, NextResponse } from "next/server";
import { validateInitData } from "@/lib/validation";
import { db } from "@/lib/db";
import { users, events, nurtureQueue } from "@/lib/db/schema";
import { and, eq } from "drizzle-orm";

async function cancelPendingNurture(userId: string) {
  await db
    .update(nurtureQueue)
    .set({ status: "cancelled" })
    .where(
      and(eq(nurtureQueue.userId, userId), eq(nurtureQueue.status, "pending")),
    );
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { initData } = body as { initData: string };
    const { user: tgUser } = validateInitData(initData);

    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.telegramId, tgUser.id))
      .limit(1);

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    if (!user.questionnaireCompleted) {
      return NextResponse.json(
        { error: "Questionnaire not completed" },
        { status: 400 },
      );
    }

    if (user.segment !== "HIGH" && user.segment !== "MID") {
      return NextResponse.json({ error: "Invalid segment" }, { status: 400 });
    }

    if (user.intentConfirmedAt) {
      return NextResponse.json(
        { error: "Already progressed" },
        { status: 400 },
      );
    }

    if (user.intentDeclinedAt) {
      return NextResponse.json({ ok: true, already: true });
    }

    const now = new Date();

    await cancelPendingNurture(user.id);

    const schedules = [
      new Date(now.getTime()),
      new Date(now.getTime() + 24 * 60 * 60 * 1000),
      new Date(now.getTime() + 48 * 60 * 60 * 1000),
    ];

    for (let i = 0; i < schedules.length; i++) {
      await db.insert(nurtureQueue).values({
        userId: user.id,
        telegramId: user.telegramId,
        step: i,
        scheduledAt: schedules[i]!,
        status: "pending",
        nurtureKind: "intent_decline",
        broadcastType: "nurture",
      });
    }

    await db
      .update(users)
      .set({ intentDeclinedAt: now })
      .where(eq(users.id, user.id));

    await db.insert(events).values({
      userId: user.id,
      telegramId: user.telegramId,
      eventType: "intent_decline",
      metadata: { segment: user.segment },
      country: user.country,
    });

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}
