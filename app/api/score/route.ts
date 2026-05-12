import { NextRequest, NextResponse } from "next/server";
import { validateInitData } from "@/lib/validation";
import { db } from "@/lib/db";
import {
  users,
  questionnaireAnswers,
  events,
  nurtureQueue,
} from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { calculateScore } from "@/lib/scoring";
import { voluumPostbackUrl } from "@/lib/voluum";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { initData, answers } = body;

    const { user: tgUser } = validateInitData(initData);

    if (!answers.ageVerified) {
      return NextResponse.json({
        exit: true,
        reason: "age",
        message: "You must be 18 or over to continue.",
      });
    }

    const result = calculateScore({
      capital: answers.capital,
      experience: answers.experience,
      goal: answers.goal,
      readiness: answers.readiness,
    });

    if (
      answers.capital === "under_100" &&
      answers.readiness === "not_ready"
    ) {
      return NextResponse.json({
        exit: true,
        reason: "not_ready",
        segment: "LOW",
        message:
          "No problem — join the free channel to follow along and come back when you're ready.",
        channelLink: process.env.NEXT_PUBLIC_CHANNEL_LINK,
      });
    }

    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.telegramId, tgUser.id))
      .limit(1);

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    await db.insert(questionnaireAnswers).values({
      userId: user.id,
      ageVerified: answers.ageVerified,
      capital: answers.capital,
      experience: answers.experience,
      goal: answers.goal,
      readiness: answers.readiness,
      rawScore: result.rawScore,
      cappedScore: result.cappedScore,
    });

    await db
      .update(users)
      .set({
        score: result.cappedScore,
        segment: result.segment,
        questionnaireCompleted: true,
        questionnaireCompletedAt: new Date(),
        /** New answers = new post-funnel round; stale intent skips product-match otherwise. */
        intentConfirmedAt: null,
        intentDeclinedAt: null,
        confirmedProductKey: null,
        bundleOfferShown: false,
        bundleAccepted: null,
      })
      .where(eq(users.id, user.id));

    await db.insert(events).values({
      userId: user.id,
      telegramId: user.telegramId,
      eventType: "questionnaire_complete",
      metadata: {
        score: result.cappedScore,
        segment: result.segment,
        capital: answers.capital,
        readiness: answers.readiness,
      },
      country: user.country,
    });

    if (result.segment === "MID") {
      const now = new Date();
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
          nurtureKind: "mid",
        });
      }
    }

    if (user.voluumCid && process.env.VOLUUM_POSTBACK_URL) {
      const url = voluumPostbackUrl(
        process.env.VOLUUM_POSTBACK_URL,
        user.voluumCid,
        "questionnaire_complete",
      );
      fetch(url, { method: "GET" }).catch(() => {});
    }

    return NextResponse.json({
      success: true,
      score: result.cappedScore,
      segment: result.segment,
      channelLink: process.env.NEXT_PUBLIC_CHANNEL_LINK,
      requiresConfirmation: result.segment === "HIGH",
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("/api/score error:", message);
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}
