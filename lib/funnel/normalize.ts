export const AD_VARIANTS = ["ad4", "ad5", "ad6"] as const;
export type AdVariant = (typeof AD_VARIANTS)[number];

export function isAdVariant(v: string): v is AdVariant {
  return (AD_VARIANTS as readonly string[]).includes(v);
}

/**
 * Normalize start_param / DB offer names to ad4 | ad5 | ad6.
 * Legacy names (ad1–ad3, vid*, lp*) and unknowns map to ad4 so old links / sticky rows stay valid.
 */
export function normalizeEntryVariant(
  raw: string | null | undefined,
): AdVariant {
  if (!raw) return "ad4";
  const v = raw.trim().toLowerCase();
  if (v === "ad4" || v === "ad5" || v === "ad6") return v;
  if (v === "gtmocode" || v === "code") return "ad4";
  if (v === "ad1" || v === "ad2" || v === "ad3") return "ad4";
  if (v.startsWith("vid")) return "ad4";
  if (v.startsWith("lp")) return "ad4";
  return "ad4";
}
