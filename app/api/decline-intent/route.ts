import { NextRequest, NextResponse } from "next/server";
import { validateInitData } from "@/lib/validation";
import { db } from "@/lib/db";
import { users, events } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

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
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);

    if (
      message.includes("Invalid") ||
      message.includes("Unauthorized") ||
      message.includes("hash") ||
      message.includes("expired")
    ) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    console.error("[decline-intent] unexpected error:", message);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
