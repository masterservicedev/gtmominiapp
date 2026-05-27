import type { ProductMatch, ProductKey } from "@/lib/productMatch";
import { LEGACY_PRODUCT_KEY_FX } from "@/lib/productMatch";
import { getProductMatch } from "@/lib/productMatch";
import type { Capital } from "@/lib/scoring";
import type { InferSelectModel } from "drizzle-orm";
import type { questionnaireAnswers, users } from "@/lib/db/schema";
import { getBundleCopy, getNonBundleAgentClose } from "@/lib/bundleCopy";

type UserRow = InferSelectModel<typeof users>;
type AnswerRow = InferSelectModel<typeof questionnaireAnswers> | null;

/**
 * Same tier lines as legacy bot `getOfferLine` — now sourced from lib/bundleCopy.ts.
 *
 * `bundleDeclined` indicates the user actively opted out of the bundle in the
 * mini app (`bundleOfferShown && bundleAccepted === false`). In that case we
 * surface the primary-only close so the specialist does not lead with a bonus
 * the lead has already turned down.
 */
export function getOfferLine(
  capital: string,
  bundleEligible: boolean,
  bundleDeclined = false,
): string {
  const cap = capitalFromAnswers(capital);
  if (!bundleEligible) {
    return getNonBundleAgentClose(cap);
  }
  const bundle = getBundleCopy(cap);
  if (!bundle) return getNonBundleAgentClose(cap);
  if (bundleDeclined) return bundle.agentPrimaryOnlyClose;
  return bundle.agentSuggestedClose;
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
  if (key === LEGACY_PRODUCT_KEY_FX) return "FX Basics";
  switch (key) {
    case "starter":
      return "MT5 Guide + Ebook";
    case "mt5_guide":
      return "MT5 Guide";
    case "ebook":
      return "Ebook";
    case "vip":
      return "VIP access";
    case "fx_basics":
      return "FX Basics";
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

  const bundleCopy = getBundleCopy(cap);
  const bundleLines: string[] = [];
  if (extras) {
    const explicitlyDeclined =
      extras.bundleOfferShown && extras.bundleAccepted === false;
    if (explicitlyDeclined) {
      bundleLines.push(
        ``,
        `You're proceeding with the primary offer only — no mini app activation bonus attached.`,
      );
    } else if (bundleCopy) {
      bundleLines.push(``, bundleCopy.customerDmLine);
    }
  } else if (
    bundleCopy &&
    (user.bundleEligible ?? false) &&
    !(user.bundleUsed ?? false)
  ) {
    bundleLines.push(``, bundleCopy.customerDmLine);
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
    case "starter":
      return "📗";
    case "mt5_guide":
      return "📗";
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

/** Mini-app activation bonus shown on lead cards — keyed by matched product, not bundle flags alone. */
function buildBonusLine(
  productKey: ProductKey,
  bundleOfferShown: boolean,
  bundleAccepted: boolean | null,
): string {
  if (bundleOfferShown && bundleAccepted === false) {
    return "No bonus attached";
  }
  switch (productKey) {
    case "starter":
      return "Ebook included with MT5 Guide 🎁";
    case "vip":
      return "MT5 Guide included after deposit 🎁";
    case "fx_basics":
      return "Ebook included after deposit 🎁";
    case "school":
      return "1 free product after deposit 🎁";
    default:
      return "No bonus attached";
  }
}

function buildAgentActivationStep(
  productKey: ProductKey,
  bundleDeclined: boolean,
): string {
  if (bundleDeclined) {
    switch (productKey) {
      case "starter":
        return "Activate MT5 Guide access only";
      case "vip":
        return "Activate VIP access only";
      case "fx_basics":
        return "Activate FX Basics access only";
      case "school":
        return "Activate School access only";
      default:
        return `Activate ${productDisplayName(productKey)}`;
    }
  }
  switch (productKey) {
    case "starter":
      return "Activate MT5 Guide + Ebook";
    case "vip":
      return "Activate VIP access + MT5 Guide";
    case "fx_basics":
      return "Activate FX Basics + Ebook";
    case "school":
      return "Activate School access + selected free product";
    default:
      return `Activate ${productDisplayName(productKey)}`;
  }
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
  const bundleDeclined =
    (extras?.bundleOfferShown ?? false) && extras?.bundleAccepted === false;
  const closeLine = getOfferLine(
    capital,
    user.bundleEligible ?? false,
    bundleDeclined,
  );
  const bonusLine = buildBonusLine(
    productMatch.productKey,
    extras?.bundleOfferShown ?? false,
    extras?.bundleAccepted ?? null,
  );
  const agentActivationStep = buildAgentActivationStep(
    productMatch.productKey,
    bundleDeclined,
  );

  const header = extras?.reactivation
    ? `[GTMO REACTIVATION LEAD]`
    : `[GTMO QUALIFIED LEAD]`;

  const lines: string[] = [
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
  ];

  if (bundleDeclined) {
    lines.push(`Bundle declined: YES`);
    lines.push(`Re-offer bonus only if the lead asks.`);
  }

  lines.push(
    ``,
    `Suggested Close:`,
    `${closeLine}`,
    ``,
    `Agent Action:`,
    `1. Send broker registration link`,
    `2. Apply deposit-confirmed label HERE (GTMOMiniAppBot inbox) after deposit is verified.`,
    `3. ${agentActivationStep}`,
  );

  return lines.join("\n");
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
