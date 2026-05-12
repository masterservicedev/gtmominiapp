import type { ProductMatch, ProductKey } from "@/lib/productMatch";
import type { Capital } from "@/lib/scoring";
import type { InferSelectModel } from "drizzle-orm";
import type { questionnaireAnswers, users } from "@/lib/db/schema";

type UserRow = InferSelectModel<typeof users>;
type AnswerRow = InferSelectModel<typeof questionnaireAnswers> | null;

/** Same tier lines as legacy bot `getOfferLine` (agent “offer to lead” line). */
export function getOfferLine(capital: string, bundleEligible: boolean): string {
  if (!bundleEligible) {
    const standard: Record<string, string> = {
      under_100: "No current offer — channel access only",
      "100_300": "$100 deposit → VIP access",
      "300_1000": "$200 deposit → FX Basics or Education",
      "1000_plus": "$500 deposit → School access",
    };
    return standard[capital] || "See agent for options";
  }

  const bundle: Record<string, string> = {
    under_100: "No current offer — channel access only",
    "100_300": "$100 deposit → VIP + Ebook bundle 🎁",
    "300_1000": "$200 deposit → Pick 1 product + 50% off second 🎁",
    "1000_plus": "$500 deposit → School + 1 product of choice FREE 🎁",
  };
  return bundle[capital] || "See agent for options";
}

export function getScoreEmoji(score: number): string {
  if (score >= 5) return "🔴";
  if (score >= 3) return "🟡";
  return "⚪";
}

export function productDisplayName(key: ProductKey): string {
  switch (key) {
    case "ebook":
      return "Ebook";
    case "vip":
      return "VIP access";
    case "fx_education":
      return "FX Basics or Education";
    case "school":
      return "School access";
    default:
      throw new Error(`Unhandled product key: ${String(key)}`);
  }
}

export type LeadCardExtras = {
  productMatch: ProductMatch;
  bundleOfferShown: boolean;
  bundleAccepted: boolean | null;
};

/** User-facing pre-approval DM (before lead card block). */
export function buildPreApprovalUserMessage(): string {
  return `✅ You've been pre-approved for GTMO Trading access.\n\nA specialist from our team is reviewing your application now.\n\nPlease reply *READY* to confirm you're available to proceed.`;
}

/** Full `[GTMO QUALIFIED LEAD]` block for Telegram (and Chatwoot mirror). */
export function buildQualifiedLeadCardText(
  user: UserRow,
  answers: AnswerRow,
  extras?: LeadCardExtras,
): string {
  const capital = answers?.capital ?? "under_100";
  const emoji = getScoreEmoji(user.score || 0);
  const offerLine = getOfferLine(capital, user.bundleEligible ?? false);

  const productBlock =
    extras != null
      ? [
          `Product confirmed: ${productDisplayName(extras.productMatch.productKey)}`,
          `Deposit required: $${extras.productMatch.depositRequiredUsd} via Vantage`,
          `Bundle offer shown: ${extras.bundleOfferShown ? "YES" : "NO"}`,
          `Bundle accepted: ${
            extras.bundleAccepted === null
              ? "N/A"
              : extras.bundleAccepted
                ? "YES — first deposit applies"
                : "NO"
          }`,
          ``,
        ].join("\n")
      : "";

  return [
    `[GTMO QUALIFIED LEAD]`,
    ``,
    `Score: ${user.score} ${emoji}`,
    `Capital declared: ${answers?.capital?.replace(/_/g, " ") || "unknown"}`,
    ...(productBlock ? [productBlock] : []),
    `Experience: ${answers?.experience?.replace(/_/g, " ") || "unknown"}`,
    `Goal: ${answers?.goal?.replace(/_/g, " ") || "unknown"}`,
    `Readiness: ${answers?.readiness?.replace(/_/g, " ") || "unknown"}`,
    ``,
    `Source: ${user.entryVariant || "direct"}`,
    `CID: ${user.voluumCid || "none"}`,
    `Country: ${user.country || "unknown"}`,
    ``,
    `Mini app user: ${user.miniAppUser ? "YES" : "NO"}`,
    `Bundle eligible: ${user.bundleEligible ? "YES — first deposit" : "NO"}`,
    `Products owned: ${user.productsUnlocked?.length ? user.productsUnlocked.join(", ") : "none"}`,
    ``,
    `→ Offer to lead with: ${offerLine}`,
    ``,
    `Agent action: send Vantage affiliate link, confirm deposit receipt`,
  ].join("\n");
}

export function capitalFromAnswers(capital: string | undefined): Capital {
  const c = capital as Capital | undefined;
  if (
    c === "under_100" ||
    c === "100_300" ||
    c === "300_1000" ||
    c === "1000_plus"
  ) {
    return c;
  }
  return "under_100";
}
