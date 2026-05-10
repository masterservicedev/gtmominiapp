export const AD_VARIANTS = ["ad1", "ad2", "ad3"] as const;
export type AdVariant = (typeof AD_VARIANTS)[number];

export function isAdVariant(v: string): v is AdVariant {
  return (AD_VARIANTS as readonly string[]).includes(v);
}

/** Normalize start_param / DB offer names to ad1 | ad2 | ad3 */
export function normalizeEntryVariant(
  raw: string | null | undefined,
): AdVariant {
  if (!raw) return "ad1";
  const v = raw.trim().toLowerCase();
  if (v === "ad1" || v === "ad2" || v === "ad3") return v;
  if (v.startsWith("vid")) return "ad1";
  if (v.startsWith("lp")) return "ad3";
  return "ad1";
}
