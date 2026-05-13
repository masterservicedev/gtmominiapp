import { NextRequest, NextResponse } from "next/server";
import { validateInitData } from "@/lib/validation";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { getLatestQuestionnaireAnswers } from "@/lib/db/questionnaire";
import { getProductMatch } from "@/lib/productMatch";
import { capitalFromAnswers, productDisplayName } from "@/lib/leadCardContent";
import {
  parseReactivateOfferId,
  loadActiveOfferForUser,
} from "@/lib/reactivateHandoff";

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as {
      initData: string;
      offerId?: string | null;
    };
    const v = validateInitData(body.initData);
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.telegramId, v.user.id))
      .limit(1);

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const offerId =
      (typeof body.offerId === "string" && body.offerId) ||
      parseReactivateOfferId(v.startParam);

    const answers = await getLatestQuestionnaireAnswers(user.id);
    const cap = capitalFromAnswers(answers?.capital);
    const pm = getProductMatch(
      cap,
      user.bundleEligible ?? false,
      user.bundleUsed ?? false,
    );

    if (user.bundleUsed) {
      return NextResponse.json({
        state: "deposited" as const,
        message: "You're already active — your specialist has your details.",
      });
    }

    let offer: Awaited<ReturnType<typeof loadActiveOfferForUser>> = null;
    if (offerId) {
      offer = await loadActiveOfferForUser(offerId, user.id);
    }

    const needCapitalQuestion =
      user.segment === "LOW" && answers?.capital === "under_100";

    return NextResponse.json({
      state: offer ? ("valid" as const) : ("no_offer" as const),
      user: {
        firstName: user.firstName,
        segment: user.segment,
        bundleEligible: user.bundleEligible,
        bundleUsed: user.bundleUsed,
        bundleAccepted: user.bundleAccepted,
        confirmedProductKey: user.confirmedProductKey,
      },
      offer: offer
        ? {
            id: offer.id,
            offerType: offer.offerType,
            expiresAt: offer.expiresAt,
          }
        : null,
      productMatch: {
        productKey: pm.productKey,
        displayName: productDisplayName(pm.productKey),
        depositRequiredUsd: pm.depositRequiredUsd,
        bundleOfferLine: pm.bundleOfferLine,
      },
      needCapitalQuestion,
      capital: answers?.capital ?? null,
    });
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}
