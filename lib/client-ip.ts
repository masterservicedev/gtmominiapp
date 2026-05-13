import type { NextRequest } from "next/server";

/** First hop from proxy chain (trimmed). May be empty. */
export function getClientIpRaw(req: NextRequest): string {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip")?.trim() ||
    ""
  );
}

/** Store on `users` / metadata — null if missing or placeholder. */
export function normalizeStoredClientIp(raw: string): string | null {
  const t = raw.trim();
  if (!t || t === "0.0.0.0") return null;
  return t.slice(0, 45);
}
