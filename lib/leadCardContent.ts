import type { ProductMatch, ProductKey } from "@/lib/productMatch";
import { LEGACY_PRODUCT_KEY_FX } from "@/lib/productMatch";
import { getProductMatch } from "@/lib/productMatch";
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

/** Short labels for Telegram/CRM; supports legacy DB key `fx_education`. */
export function productDisplayName(
  key: ProductKey | typeof LEGACY_PRODUCT_KEY_FX,
): string {
  if (key === LEGACY_PRODUCT_KEY_FX) return "FX Basics or Education";
  switch (key) {
    case "ebook":
      return "Ebook";
    case "vip":
      return "VIP access";
    case "fx_basics":
      return "FX Basics or Education";
    case "education":
      return "GTMO Education";
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

/** User-facing pre-approval DM (legacy READY path — prefer `buildCustomerHandoffMessage`). */
export function buildPreApprovalUserMessage(): string {
  return `✅ You've been pre-approved for GTMO Trading access.\n\nA specialist from our team is reviewing your application now.\n\nPlease reply *READY* to confirm you're available to proceed.`;
}

/**
 * Customer-visible Telegram copy only — no `[GTMO QUALIFIED LEAD]`, CID, or agent instructions.
 * When `extras` is set (in-app confirm), reflects confirmed bundle choice.
 */
export function buildCustomerHandoffMessage(
  user: UserRow,
  answers: AnswerRow,
  extras?: LeadCardExtras,
): string {
  const cap = capitalFromAnswers(answers?.capital);
  const pm =
    extras?.productMatch ??
    getProductMatch(cap, user.bundleEligible ?? false, user.bundleUsed ?? false);
  const productName = productDisplayName(pm.productKey);

  const bundleLines: string[] = [];
  if (extras) {
    if (extras.bundleOfferShown && extras.bundleAccepted === true && pm.bonusLine) {
      bundleLines.push(``, `Mini app add-on included: ${pm.bundleOfferLine}.`);
    } else if (extras.bundleOfferShown && extras.bundleAccepted === false) {
      bundleLines.push(
        ``,
        `You're proceeding with the primary offer only (no bundle add-on).`,
      );
    }
  } else if (
    pm.bundleOfferLine &&
    (user.bundleEligible ?? false) &&
    !(user.bundleUsed ?? false)
  ) {
    bundleLines.push(
      ``,
      `You may also be eligible for: *${pm.bundleOfferLine}* — tell your specialist if you'd like it included.`,
    );
  }

  const closing = [
    ``,
    `A team member will follow up in this chat with next steps.`,
  ];

  if (extras) {
    const lines: string[] = [
      `✅ Your confirmed track: *${productName}* — from *$${pm.depositRequiredUsd}* funding via Vantage when you're ready.`,
      ...bundleLines,
      ...closing,
      ``,
      `You're pre-approved for GTMO Trading access.`,
    ];
    return lines.join("\n");
  }

  const lines: string[] = [
    `✅ You've been pre-approved for GTMO Trading access.`,
    ``,
    `Your matched offer: *${productName}* — from *$${pm.depositRequiredUsd}* funding via Vantage when you're ready.`,
    ...bundleLines,
    ...closing,
  ];

  return lines.join("\n");
}

/** Full internal lead block for Chatwoot private note only — not for customer Telegram. */
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
