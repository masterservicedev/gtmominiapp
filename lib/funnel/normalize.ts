export const AD_VARIANTS = ["ad4", "ad5"] as const;
export type AdVariant = (typeof AD_VARIANTS)[number];

/** Canonical fallback when URL/DB sends empty, unknown, or legacy variant tokens. */
export const DEFAULT_AD_VARIANT: AdVariant = "ad4";

export function isAdVariant(v: string): v is AdVariant {
  return (AD_VARIANTS as readonly string[]).includes(v);
}

/**
 * Normalize start_param / DB offer names to ad4 | ad5.
 * Legacy names (ad1–ad3, vid*, lp*) and unknowns map to DEFAULT_AD_VARIANT.
 */
export function normalizeEntryVariant(
  raw: string | null | undefined,
): AdVariant {
  if (!raw) return DEFAULT_AD_VARIANT;
  const v = raw.trim().toLowerCase();
  if (v === "ad4" || v === "ad5") return v;
  if (v === "gtmocode" || v === "code") return DEFAULT_AD_VARIANT;
  if (v === "ad1" || v === "ad2" || v === "ad3") return DEFAULT_AD_VARIANT;
  if (v.startsWith("vid")) return DEFAULT_AD_VARIANT;
  if (v.startsWith("lp")) return DEFAULT_AD_VARIANT;
  return DEFAULT_AD_VARIANT;
}
