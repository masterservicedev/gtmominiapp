import { NextRequest, NextResponse } from "next/server";
import { validateInitData } from "@/lib/validation";
import { db } from "@/lib/db";
import { users, events } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { getLatestQuestionnaireAnswers } from "@/lib/db/questionnaire";
import {
  getProductMatch,
  isStarterHandoffSegment,
} from "@/lib/productMatch";
import { capitalFromAnswers } from "@/lib/leadCardContent";
import {
  sendHighIntentTelegramLead,
  attachInternalLeadToChatwoot,
  fireCrmVoluumPostback,
  buildLeadExtrasFromState,
} from "@/lib/handoffHighIntent";
import {
  cancelPendingNurture,
  scheduleHighNurture,
  scheduleLowNurture,
} from "@/lib/nurtureSchedule";

export async function POST(req: NextRequest) {
  try {
    console.log("[confirm-handoff] started");
    const body = await req.json();
    const { initData, bundleAccepted: bundleAcceptedRaw } = body as {
      initData: string;
      bundleAccepted?: boolean | null;
    };
    const { user: tgUser } = validateInitData(initData);
    console.log("[confirm-handoff] telegramId:", tgUser.id);

    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.telegramId, tgUser.id))
      .limit(1);

    if (!user) {
      console.log("[confirm-handoff] user not found in DB");
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const crmAlreadyFired = user.crmTriggered === true;

    if (!user.questionnaireCompleted) {
      return NextResponse.json(
        { error: "Questionnaire not completed" },
        { status: 400 },
      );
    }

    const answers = await getLatestQuestionnaireAnswers(user.id);
    const capital = capitalFromAnswers(answers?.capital);
    const segment = user.segment;
    console.log("[confirm-handoff] segment:", segment);
    console.log("[confirm-handoff] capital:", capital);
    const starterHandoff = isStarterHandoffSegment(segment, capital);
    if (segment !== "HIGH" && segment !== "MID" && !starterHandoff) {
      return NextResponse.json({ error: "Invalid segment" }, { status: 400 });
    }

    if (user.intentDeclinedAt) {
      return NextResponse.json(
        { error: "Intent already declined" },
        { status: 400 },
      );
    }

    if (user.intentConfirmedAt) {
      return NextResponse.json(
        { error: "Intent already confirmed" },
        { status: 400 },
      );
    }
    const bundleUsed = user.bundleUsed ?? false;
    const productMatch = getProductMatch(capital, true, bundleUsed);
    console.log("[confirm-handoff] productKey:", productMatch.productKey);
    const bundleShown = productMatch.bundleOfferLine != null;

    let bundleAccepted: boolean | null = null;
    if (bundleShown) {
      if (typeof bundleAcceptedRaw !== "boolean") {
        return NextResponse.json(
          { error: "bundleAccepted required when bundle offer applies" },
          { status: 400 },
        );
      }
      bundleAccepted = bundleAcceptedRaw;
    }

    const now = new Date();

    await cancelPendingNurture(user.id);

    if (segment === "MID") {
      await db
        .update(users)
        .set({
          intentConfirmedAt: now,
          confirmedProductKey: productMatch.productKey,
          bundleOfferShown: bundleShown,
          bundleAccepted,
        })
        .where(eq(users.id, user.id));

      await db.insert(events).values({
        userId: user.id,
        telegramId: user.telegramId,
        eventType: "intent_confirm",
        metadata: {
          segment: "MID",
          productKey: productMatch.productKey,
          bundleAccepted,
        },
        country: user.country,
      });

      return NextResponse.json({
        ok: true,
        handled: "mid_record_only",
        segment: "MID",
      });
    }

    const extras = buildLeadExtrasFromState({
      capital: answers?.capital,
      bundleEligible: true,
      bundleUsed,
      bundleAccepted,
      bundleOfferShown: bundleShown,
    });

    const conversationId = await attachInternalLeadToChatwoot(
      user.telegramId,
      productMatch.productKey,
      user,
      answers,
      extras,
    );

    const handoffMode: "chatwoot_handoff" | "telegram_fallback" = conversationId
      ? "chatwoot_handoff"
      : "telegram_fallback";

    if (!conversationId) {
      console.log("[handoff] fallback direct Telegram used");
      await sendHighIntentTelegramLead(user, answers, extras);
    }
    console.log(`[confirm-handoff] result mode: ${handoffMode}`);

    await db
      .update(users)
      .set({
        intentConfirmedAt: now,
        confirmedProductKey: productMatch.productKey,
        bundleOfferShown: bundleShown,
        bundleAccepted,
        crmTriggered: true,
        crmTriggeredAt: crmAlreadyFired
          ? (user.crmTriggeredAt ?? now)
          : now,
        chatwootConversationId: conversationId ?? user.chatwootConversationId,
      })
      .where(eq(users.id, user.id));

    await db.insert(events).values({
      userId: user.id,
      telegramId: user.telegramId,
      eventType: "handoff_confirmed",
      metadata: {
        productKey: productMatch.productKey,
        bundleAccepted,
        conversationId,
        mode: handoffMode,
        afterTelegramReady: crmAlreadyFired,
      },
      country: user.country,
    });

    if (!crmAlreadyFired) {
      await db.insert(events).values({
        userId: user.id,
        telegramId: user.telegramId,
        eventType: "crm_triggered",
        metadata: {
          score: user.score,
          segment: user.segment,
          source: "mini_app_intent",
          productKey: productMatch.productKey,
          variant: user.entryVariant,
        },
        country: user.country,
      });

      await fireCrmVoluumPostback(user.voluumCid);

      if (segment === "HIGH") {
        await scheduleHighNurture(user.id, user.telegramId, now);
      } else if (starterHandoff) {
        await scheduleLowNurture(user.id, user.telegramId, now);
      }
    }

    return NextResponse.json({
      ok: true,
      handled:
        handoffMode === "chatwoot_handoff"
          ? "high_handoff"
          : "high_handoff_telegram_fallback",
      mode: handoffMode,
      handoffFallback: handoffMode === "telegram_fallback",
      segment: user.segment,
    });
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

    console.error("[confirm-handoff] unexpected error:", message);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
