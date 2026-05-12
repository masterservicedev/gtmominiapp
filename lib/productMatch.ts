import type { Capital } from "@/lib/scoring";

/** Stable keys for DB + Chatwoot labels (`product-${key}`). */
export type ProductKey = "ebook" | "vip" | "fx_education" | "school";

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
  switch (capital) {
    case "100_300":
      return {
        bonusLine: "Ebook included free (mini app exclusive).",
        bundleOfferLine: "VIP + Ebook bundle",
      };
    case "300_1000":
      return {
        bonusLine: "Second product at 50% off (mini app exclusive).",
        bundleOfferLine: "Pick one product + second at half price",
      };
    case "1000_plus":
      return {
        bonusLine: "One additional product of your choice — free (mini app exclusive).",
        bundleOfferLine: "School + one free product",
      };
    default:
      return {
        bonusLine: "10% off your next product (mini app exclusive).",
        bundleOfferLine: "10% off your next product",
      };
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
        productKey: "ebook",
        depositRequiredUsd: 50,
        primaryTitle: "Ebook access",
        primaryLine: "$50 deposit unlocks the Ebook.",
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
        productKey: "fx_education",
        depositRequiredUsd: 200,
        primaryTitle: "FX Basics or Education",
        primaryLine: "$200 deposit — choose FX Basics or Education.",
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
