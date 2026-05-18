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
  /** Set when the user is picking up after a broadcast /reactivate confirm. */
  reactivation?: boolean;
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
      `✅ We saved your selection: *${productName}* — *$${pm.depositRequiredUsd}* minimum when you fund via your registration link.`,
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
    `Your offer: *${productName}* — *$${pm.depositRequiredUsd}* minimum when you fund via your registration link.`,
    ...bundleLines,
    ...closing,
  ];

  return lines.join("\n");
}

function humanize(
  value: string | null | undefined,
  fallback = "unknown",
): string {
  return value ? value.replace(/_/g, " ") : fallback;
}

function capitalLabel(capital: string | null | undefined): string {
  switch (capital) {
    case "under_100":
      return "$0–$100";
    case "100_300":
      return "$100–$300";
    case "300_1000":
      return "$300–$1,000";
    case "1000_plus":
      return "$1,000+";
    default:
      return "unknown";
  }
}

function productEmoji(
  key: ProductKey | typeof LEGACY_PRODUCT_KEY_FX,
): string {
  if (key === LEGACY_PRODUCT_KEY_FX) return "📊";
  switch (key) {
    case "ebook":
      return "📘";
    case "vip":
      return "🎯";
    case "fx_basics":
      return "📊";
    case "education":
      return "🎓";
    case "school":
      return "🏫";
    default:
      return "•";
  }
}

function buildBonusLine(
  capital: Capital,
  bundleEligible: boolean,
  bundleUsed: boolean,
  bundleOfferShown: boolean,
  bundleAccepted: boolean | null,
): string {
  if (!bundleEligible || bundleUsed) return "No bonus attached";
  if (bundleOfferShown && bundleAccepted === false) return "No bonus attached";
  if (capital === "1000_plus") return "+ 1 free product after deposit 🎁";
  if (capital === "300_1000")
    return "+ 50% off second product after deposit 🎁";
  return "No bonus attached";
}

/** Full internal lead block for Chatwoot private note only — not for customer Telegram. */
export function buildQualifiedLeadCardText(
  user: UserRow,
  answers: AnswerRow,
  extras?: LeadCardExtras,
): string {
  const capital = capitalFromAnswers(answers?.capital);
  const scoreEmoji = getScoreEmoji(user.score || 0);
  const productMatch =
    extras?.productMatch ??
    getProductMatch(
      capital,
      user.bundleEligible ?? false,
      user.bundleUsed ?? false,
    );
  const productName = productDisplayName(productMatch.productKey);
  const closeLine = getOfferLine(capital, user.bundleEligible ?? false);
  const bonusLine = buildBonusLine(
    capital,
    user.bundleEligible ?? false,
    user.bundleUsed ?? false,
    extras?.bundleOfferShown ?? false,
    extras?.bundleAccepted ?? null,
  );

  const header = extras?.reactivation
    ? `[GTMO REACTIVATION LEAD]`
    : `[GTMO QUALIFIED LEAD]`;

  return [
    header,
    ``,
    `Score: ${user.score ?? 0} ${scoreEmoji}`,
    `Capital: ${capitalLabel(answers?.capital)}`,
    `Experience: ${humanize(answers?.experience)}`,
    `Goal: ${humanize(answers?.goal)}`,
    `Readiness: ${humanize(answers?.readiness)}`,
    ``,
    `Confirmed Product:`,
    `${productEmoji(productMatch.productKey)} ${productName}`,
    ``,
    `Required Deposit:`,
    `$${productMatch.depositRequiredUsd} via broker registration link`,
    ``,
    `Lead Source:`,
    `${user.entryVariant || "direct"}`,
    `CID: ${user.voluumCid || "none"}`,
    `Country: ${user.country || "unknown"}`,
    ``,
    `Mini App User: ${user.miniAppUser ? "YES" : "NO"}`,
    `Eligible Bonus:`,
    `${bonusLine}`,
    ``,
    `Suggested Close:`,
    `${closeLine}`,
    ``,
    `Agent Action:`,
    `1. Send broker registration link`,
    `2. Confirm deposit receipt`,
    `3. Activate ${productName} + selected bonus product when eligible`,
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
