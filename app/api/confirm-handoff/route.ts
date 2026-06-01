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
  scheduleMidNurture,
} from "@/lib/nurtureSchedule";

/**
 * Confirm-handoff endpoint.
 *
 * Business rule: every user who reaches /product-match and presses confirm
 * is a priority sales opportunity. HIGH / MID / LOW are agent-context
 * labels only — they MUST NOT decide whether a CRM lead card is created.
 *
 * Idempotency: the `intentConfirmedAt` / `intentDeclinedAt` early-return
 * guards below mean this route can only run once per user per confirmation.
 * Repeated confirm clicks short-circuit to 400 before any Chatwoot or
 * Telegram side effects fire, so the unified CRM card is created exactly
 * once.
 */
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

    // Idempotency guard — repeated confirms cannot create duplicate cards.
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

    // Cancel any pending nurture (questionnaire-stage MID nurture from
    // /api/score, declined-intent nurture, etc.) so it doesn't fire while
    // an agent is already engaged. Per-segment post-confirm nurture is
    // re-scheduled below.
    await cancelPendingNurture(user.id);

    const extras = buildLeadExtrasFromState({
      capital: answers?.capital,
      bundleEligible: true,
      bundleUsed,
      bundleAccepted,
      bundleOfferShown: bundleShown,
    });

    // ── UNIFIED CRM LEAD CARD ─────────────────────────────────────────────
    // attachInternalLeadToChatwoot resolves the canonical Chatwoot contact,
    // creates/locates the API inbox conversation, posts the full lead-card
    // private note, sends the customer Telegram message via
    // sendHighIntentTelegramLead (HIGH gets the existing pre-approval copy;
    // MID/LOW get the universal confirmation message via segment branching
    // inside buildCustomerHandoffMessage), applies the segment / capital /
    // product / qualified-lead / handoff-requested / priority labels, and
    // posts the agent-facing Telegram inbox 977 summary when that
    // conversation already exists. Runs for EVERY confirmed user.
    const conversationId = await attachInternalLeadToChatwoot(
      user.telegramId,
      productMatch.productKey,
      user,
      answers,
      extras,
    );

    const chatwootHandoffOk = conversationId != null;
    const handoffMode: "chatwoot_handoff" | "telegram_fallback" =
      chatwootHandoffOk ? "chatwoot_handoff" : "telegram_fallback";

    if (!chatwootHandoffOk) {
      console.log("[confirm-handoff] chatwoot attach failed; fallback only");
      await sendHighIntentTelegramLead(user, answers, extras);
    }
    console.log(`[confirm-handoff] result mode: ${handoffMode}`);

    // Intent confirmation is recorded even when Chatwoot attach fails.
    // crmTriggered / crm_triggered / Voluum CRM postback require a real 976 conversation.
    await db
      .update(users)
      .set({
        intentConfirmedAt: now,
        confirmedProductKey: productMatch.productKey,
        bundleOfferShown: bundleShown,
        bundleAccepted,
        ...(chatwootHandoffOk
          ? {
              crmTriggered: true,
              crmTriggeredAt: crmAlreadyFired
                ? (user.crmTriggeredAt ?? now)
                : now,
              chatwootConversationId: conversationId,
            }
          : {}),
      })
      .where(eq(users.id, user.id));

    // intent_confirm event — recorded for every confirmed user.
    await db.insert(events).values({
      userId: user.id,
      telegramId: user.telegramId,
      eventType: "intent_confirm",
      metadata: {
        segment,
        capital,
        productKey: productMatch.productKey,
        bundleAccepted,
        bundleOfferShown: bundleShown,
        conversationId,
        mode: handoffMode,
      },
      country: user.country,
    });

    // handoff_confirmed event — also recorded for every confirmed user so
    // CRM/event timelines stay consistent across HIGH/MID/LOW.
    await db.insert(events).values({
      userId: user.id,
      telegramId: user.telegramId,
      eventType: "handoff_confirmed",
      metadata: {
        productKey: productMatch.productKey,
        bundleAccepted,
        conversationId: conversationId ?? null,
        mode: handoffMode,
        ...(chatwootHandoffOk
          ? {}
          : { reason: "chatwoot_attach_failed" as const }),
        segment,
        afterTelegramReady: crmAlreadyFired,
      },
      country: user.country,
    });

    if (chatwootHandoffOk && !crmAlreadyFired) {
      await db.insert(events).values({
        userId: user.id,
        telegramId: user.telegramId,
        eventType: "crm_triggered",
        metadata: {
          score: user.score,
          segment,
          source: "mini_app_intent",
          productKey: productMatch.productKey,
          variant: user.entryVariant,
        },
        country: user.country,
      });

      await fireCrmVoluumPostback(user.voluumCid);

      // Per-segment post-confirm nurture. We re-schedule after
      // cancelPendingNurture above so every segment continues to receive
      // appropriate follow-ups (HIGH day2/day5, MID day3/day10, LOW day7).
      // Nurture is additive to CRM visibility — never a replacement.
      const starterHandoff = isStarterHandoffSegment(segment, capital);
      if (segment === "HIGH") {
        await scheduleHighNurture(user.id, user.telegramId, now);
      } else if (segment === "MID") {
        await scheduleMidNurture(user.id, user.telegramId, now);
      } else if (starterHandoff) {
        await scheduleLowNurture(user.id, user.telegramId, now);
      }
    }

    // customerView drives the /result UI; CRM behaviour is identical
    // across all values. HIGH and starter-LOW keep the "pre-approved"
    // emerald HighResult UI; everyone else sees the amber MID/Welcome UI.
    const starterHandoff = isStarterHandoffSegment(segment, capital);
    const customerView: "handoff" | "intent" =
      segment === "HIGH" || starterHandoff ? "handoff" : "intent";

    return NextResponse.json({
      ok: true,
      handled: chatwootHandoffOk ? "crm_recorded" : "telegram_fallback",
      mode: handoffMode,
      handoffFallback: !chatwootHandoffOk,
      ...(chatwootHandoffOk
        ? {}
        : { reason: "chatwoot_attach_failed" as const }),
      segment,
      customerView,
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
