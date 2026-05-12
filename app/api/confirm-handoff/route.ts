import { NextRequest, NextResponse } from "next/server";
import { validateInitData } from "@/lib/validation";
import { db } from "@/lib/db";
import { users, events, nurtureQueue } from "@/lib/db/schema";
import { and, eq } from "drizzle-orm";
import { getLatestQuestionnaireAnswers } from "@/lib/db/questionnaire";
import { getProductMatch } from "@/lib/productMatch";
import { capitalFromAnswers } from "@/lib/leadCardContent";
import {
  sendHighIntentTelegramLead,
  runChatwootLabelsForHandoff,
  fireCrmVoluumPostback,
  buildLeadExtrasFromState,
} from "@/lib/handoffHighIntent";

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
    const { initData, bundleAccepted: bundleAcceptedRaw } = body as {
      initData: string;
      bundleAccepted?: boolean | null;
    };
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

    const segment = user.segment;
    if (segment !== "HIGH" && segment !== "MID") {
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

    const answers = await getLatestQuestionnaireAnswers(user.id);
    const capital = capitalFromAnswers(answers?.capital);
    const bundleEligible = user.bundleEligible ?? false;
    const bundleUsed = user.bundleUsed ?? false;
    const productMatch = getProductMatch(capital, bundleEligible, bundleUsed);
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
    const setBundleUsed =
      bundleEligible &&
      !bundleUsed &&
      bundleShown &&
      bundleAccepted === true;

    await cancelPendingNurture(user.id);

    if (segment === "MID") {
      await db
        .update(users)
        .set({
          intentConfirmedAt: now,
          confirmedProductKey: productMatch.productKey,
          bundleOfferShown: bundleShown,
          bundleAccepted,
          bundleUsed: setBundleUsed ? true : user.bundleUsed,
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

    if (user.crmTriggered) {
      return NextResponse.json(
        { error: "CRM already triggered" },
        { status: 409 },
      );
    }

    const extras = buildLeadExtrasFromState({
      capital: answers?.capital,
      bundleEligible,
      bundleUsed,
      bundleAccepted,
      bundleOfferShown: bundleShown,
    });

    await sendHighIntentTelegramLead(user, answers, extras);

    const conversationId = await runChatwootLabelsForHandoff(
      user.telegramId,
      productMatch.productKey,
    );

    await db
      .update(users)
      .set({
        intentConfirmedAt: now,
        confirmedProductKey: productMatch.productKey,
        bundleOfferShown: bundleShown,
        bundleAccepted,
        bundleUsed: setBundleUsed ? true : user.bundleUsed,
        crmTriggered: true,
        crmTriggeredAt: now,
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
      },
      country: user.country,
    });

    await db.insert(events).values({
      userId: user.id,
      telegramId: user.telegramId,
      eventType: "crm_triggered",
      metadata: {
        score: user.score,
        segment: user.segment,
        source: "mini_app_intent",
        productKey: productMatch.productKey,
      },
      country: user.country,
    });

    await fireCrmVoluumPostback(user.voluumCid);

    return NextResponse.json({
      ok: true,
      handled: "high_handoff",
      segment: "HIGH",
    });
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}
