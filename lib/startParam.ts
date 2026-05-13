const KNOWN_KEYS = new Set(["cid", "src", "cmp", "var"]);

export interface StartParamParsed {
  cid: string | null;
  source: string | null;
  campaign: string | null;
  variant: string | null;
  referrerId: string | null;
}

/** True when this segment is meant as a funnel variant (ad4, code, etc.). */
function looksLikeVariantSegment(s: string): boolean {
  const v = s.trim().toLowerCase();
  if (!v) return false;
  if (v === "code" || v === "gtmocode") return true;
  return /^ad\d+$/.test(v);
}

/**
 * Voluum-style legacy: prefix_clickid_variant (3+ parts → cid at [1], variant at [2]),
 * clickid_variant (2 parts), or single startapp=ad4 / click id only.
 */
function parseLegacyVoluum(startParam: string): Pick<
  StartParamParsed,
  "cid" | "variant"
> {
  const raw = (startParam || "").trim();
  if (!raw || raw.startsWith("ref_")) {
    return { cid: null, variant: null };
  }
  const parts = raw.split("_").filter((p) => p.length > 0);
  const n = parts.length;

  if (n >= 3) {
    return { cid: parts[1] ?? null, variant: parts[2] ?? null };
  }
  if (n === 2) {
    return { cid: parts[0] ?? null, variant: parts[1] ?? null };
  }
  if (n === 1) {
    const only = parts[0]!;
    if (looksLikeVariantSegment(only)) {
      return { cid: null, variant: only };
    }
    return { cid: only, variant: null };
  }
  return { cid: null, variant: null };
}

/** Greedy key/value: values may contain underscores until the next known key token. */
function parseKvPayload(trimmed: string): Record<string, string> | null {
  const parts = trimmed.split("_").filter((p) => p.length > 0);
  const map: Record<string, string> = {};
  let i = 0;
  while (i < parts.length) {
    const key = parts[i]!;
    if (!KNOWN_KEYS.has(key)) {
      i++;
      continue;
    }
    i++;
    const valParts: string[] = [];
    while (i < parts.length && !KNOWN_KEYS.has(parts[i]!)) {
      valParts.push(parts[i]!);
      i++;
    }
    if (valParts.length > 0) {
      map[key] = valParts.join("_");
    }
  }
  if (Object.keys(map).length === 0) return null;
  return map;
}

/**
 * Parses Telegram `start_param` / `startapp` payload.
 * - `ref_*` → referral attribution.
 * - `cid_*_src_*_cmp_*` (optional `_var_*`) → greedy key/value (underscores allowed in values).
 * - Otherwise → legacy Voluum-style token layout (see `parseLegacyVoluum`).
 */
export function parseStartParam(raw: string): StartParamParsed {
  const trimmed = (raw || "").trim();
  if (!trimmed) {
    return {
      cid: null,
      source: null,
      campaign: null,
      variant: null,
      referrerId: null,
    };
  }

  if (trimmed.startsWith("ref_")) {
    return {
      cid: null,
      source: "referral",
      campaign: "referral",
      variant: null,
      referrerId: trimmed.slice(4) || null,
    };
  }

  const map = parseKvPayload(trimmed);
  if (
    map &&
    (map.cid != null || map.src != null || map.cmp != null || map.var != null)
  ) {
    return {
      cid: map.cid ?? null,
      source: map.src ?? null,
      campaign: map.cmp ?? null,
      variant: map.var ?? null,
      referrerId: null,
    };
  }

  const leg = parseLegacyVoluum(trimmed);
  return {
    cid: leg.cid,
    source: null,
    campaign: null,
    variant: leg.variant,
    referrerId: null,
  };
}
