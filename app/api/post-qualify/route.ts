import { NextRequest, NextResponse } from "next/server";
import { validateInitData } from "@/lib/validation";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { getLatestQuestionnaireAnswers } from "@/lib/db/questionnaire";
import { getProductMatch } from "@/lib/productMatch";
import { capitalFromAnswers } from "@/lib/leadCardContent";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { initData } = body;
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
      return NextResponse.json(
        { error: "No post-qualify flow for this segment", segment },
        { status: 400 },
      );
    }

    const answers = await getLatestQuestionnaireAnswers(user.id);
    const capital = capitalFromAnswers(answers?.capital);
    const bundleEligible = user.bundleEligible ?? false;
    const bundleUsed = user.bundleUsed ?? false;
    const productMatch = getProductMatch(capital, bundleEligible, bundleUsed);

    // #region agent log
    fetch("http://127.0.0.1:7586/ingest/a06de864-e48c-47c4-804c-fea5dbfaf96a", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Debug-Session-Id": "22219e",
      },
      body: JSON.stringify({
        sessionId: "22219e",
        hypothesisId: "H1",
        location: "app/api/post-qualify/route.ts",
        message: "post_qualify_flags",
        data: {
          segment,
          hasIntent: Boolean(user.intentConfirmedAt),
          hasDecline: Boolean(user.intentDeclinedAt),
          crmTriggered: user.crmTriggered === true,
        },
        timestamp: Date.now(),
        runId: "intent-reset-v1",
      }),
    }).catch(() => {});
    // #endregion

    return NextResponse.json({
      segment,
      capital,
      bundleEligible,
      bundleUsed,
      bundleOfferShown: user.bundleOfferShown ?? false,
      bundleAccepted: user.bundleAccepted,
      productMatch,
      score: user.score,
      alreadyCrm: user.crmTriggered,
      intentConfirmedAt: user.intentConfirmedAt,
      intentDeclinedAt: user.intentDeclinedAt,
    });
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}
