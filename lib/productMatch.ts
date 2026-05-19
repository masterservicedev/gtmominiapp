import type { Capital } from "@/lib/scoring";
import { getBundleCopy } from "@/lib/bundleCopy";

/** Stable keys for DB + Chatwoot labels (`product-${key}`). */
export type ProductKey =
  | "starter"
  | "mt5_guide"
  | "ebook"
  | "vip"
  | "fx_basics"
  | "education"
  | "school";

/** Legacy `confirmed_product_key` / URL value from before split. */
export const LEGACY_PRODUCT_KEY_FX = "fx_education" as const;

/** Active matching keys (excludes legacy `education`). */
export const ACTIVE_PRODUCT_KEYS: ProductKey[] = [
  "starter",
  "mt5_guide",
  "ebook",
  "vip",
  "fx_basics",
  "school",
];

export function parseProductKey(
  raw: string | null | undefined,
): ProductKey | null {
  if (!raw) return null;
  if (raw === LEGACY_PRODUCT_KEY_FX) return "fx_basics";
  const keys: ProductKey[] = [
    "starter",
    "mt5_guide",
    "ebook",
    "vip",
    "fx_basics",
    "education",
    "school",
  ];
  return keys.includes(raw as ProductKey) ? (raw as ProductKey) : null;
}

export function canAccessPostQualifyFlow(
  segment: string | null | undefined,
  capital: Capital,
): boolean {
  return (
    segment === "HIGH" ||
    segment === "MID" ||
    (segment === "LOW" && capital === "under_100")
  );
}

export function isStarterHandoffSegment(
  segment: string | null | undefined,
  capital: Capital,
): boolean {
  return segment === "LOW" && capital === "under_100";
}

/** HIGH leads and ready under_100 starter leads get Chatwoot/Telegram handoff. */
export function qualifiesForCrmHandoff(
  segment: string | null | undefined,
  capital: Capital,
): boolean {
  return segment === "HIGH" || isStarterHandoffSegment(segment, capital);
}

export type ProductMatch = {
  productKey: ProductKey;
  /** Minimum funding step shown to the user (USD). */
  depositRequiredUsd: number;
  /** Short title for UI. */
  primaryTitle: string;
  /** One line describing what they unlock. */
  primaryLine: string;
  /** Extra line when mini-app bundle applies (shown + accepted path). */
  bonusLine: string | null;
  /** Marketing line for bundle when eligible and not yet used. */
  bundleOfferLine: string | null;
};

function bundleLines(
  capital: Capital,
  showBundle: boolean,
): { bonusLine: string | null; bundleOfferLine: string | null } {
  if (!showBundle) {
    return { bonusLine: null, bundleOfferLine: null };
  }
  const copy = getBundleCopy(capital);
  if (!copy) {
    return { bonusLine: null, bundleOfferLine: null };
  }
  switch (capital) {
    case "under_100":
      return {
        bonusLine: copy.userPanelHeadline,
        bundleOfferLine: "MT5 Guide + Ebook starter",
      };
    case "100_300":
      return {
        bonusLine: "MT5 Guide included (mini app exclusive).",
        bundleOfferLine: "VIP + MT5 Guide",
      };
    case "300_1000":
      return {
        bonusLine: "GTMO Ebook included (mini app exclusive).",
        bundleOfferLine: "FX Basics + Ebook",
      };
    case "1000_plus":
      return {
        bonusLine:
          "One additional product of your choice — free (mini app exclusive).",
        bundleOfferLine: "School + one free product",
      };
    default:
      return { bonusLine: null, bundleOfferLine: null };
  }
}

/**
 * Maps declared capital + bundle flags to product/deposit — aligned with
 * `getOfferLine` in lib/leadCardContent.ts.
 */
export function getProductMatch(
  capital: Capital,
  bundleEligible: boolean,
  bundleUsed: boolean,
): ProductMatch {
  const showBundle = bundleEligible && !bundleUsed;
  const { bonusLine, bundleOfferLine } = bundleLines(capital, showBundle);

  switch (capital) {
    case "under_100":
      return {
        productKey: "starter",
        depositRequiredUsd: 50,
        primaryTitle: "MT5 Guide + Ebook",
        primaryLine: "$50 minimum funding activates MT5 Guide + Ebook.",
        bonusLine: showBundle ? bonusLine : null,
        bundleOfferLine: showBundle ? bundleOfferLine : null,
      };
    case "100_300":
      return {
        productKey: "vip",
        depositRequiredUsd: 100,
        primaryTitle: "VIP signals access",
        primaryLine: "$100 deposit unlocks VIP access.",
        bonusLine: showBundle ? bonusLine : null,
        bundleOfferLine: showBundle ? bundleOfferLine : null,
      };
    case "300_1000":
      return {
        productKey: "fx_basics",
        depositRequiredUsd: 200,
        primaryTitle: "FX Basics",
        primaryLine: "$200 deposit unlocks FX Basics access.",
        bonusLine: showBundle ? bonusLine : null,
        bundleOfferLine: showBundle ? bundleOfferLine : null,
      };
    case "1000_plus":
      return {
        productKey: "school",
        depositRequiredUsd: 500,
        primaryTitle: "School access",
        primaryLine: "$500 deposit unlocks School access.",
        bonusLine: showBundle ? bonusLine : null,
        bundleOfferLine: showBundle ? bundleOfferLine : null,
      };
    default:
      throw new Error(`Unhandled capital: ${String(capital)}`);
  }
}

export function productKeyToChatwootLabelSuffix(key: ProductKey): string {
  return key.replace(/_/g, "-");
}
