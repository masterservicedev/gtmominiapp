/**
 * Railway/UI often pastes env values with accidental newlines or spaces.
 * Telegram rejects web_app buttons if `url` is missing or invalid.
 */
export function getBotToken(): string {
  return (process.env.TELEGRAM_BOT_TOKEN ?? "").trim();
}

/** HTTPS URL for the Mini App, or undefined if unset/invalid */
export function getMiniAppUrl(): string | undefined {
  const raw = (process.env.MINI_APP_URL ?? "").trim();
  if (!raw) return undefined;
  try {
    const u = new URL(raw);
    if (u.protocol !== "https:") return undefined;
    return u.toString().replace(/\/$/, "") || undefined;
  } catch {
    return undefined;
  }
}

/**
 * URL for `web_app` buttons. Telegram reads `startapp` and exposes it as
 * `WebApp.initDataUnsafe.start_param` inside the Mini App (same origin — not an external browser tab).
 *
 * - If `startPayload` is set and not `ref_*`, it becomes `?startapp=...` (e.g. Voluum `clickid_ad4`).
 * - Otherwise uses `MINI_APP_START_PARAM` (e.g. `ad4` so the GTMO Signals funnel opens in-app).
 */
export function getMiniAppWebAppUrl(startPayload?: string | null): string | undefined {
  const base = getMiniAppUrl();
  if (!base) return undefined;

  let start = (startPayload ?? "").trim();
  if (start.startsWith("ref_")) {
    start = "";
  }

  if (!start) {
    start = (process.env.MINI_APP_START_PARAM ?? "").trim();
  }

  if (!start) {
    return base;
  }

  try {
    const u = new URL(base);
    u.searchParams.set("startapp", start);
    return u.toString();
  } catch {
    return base;
  }
}

/**
 * Public signals channel URL for outbound Telegram `url:` buttons (e.g.
 * NEXT_PUBLIC_CHANNEL_LINK). Railway workers often reuse the same env as the Next app.
 */
export function getChannelLinkUrl(): string | undefined {
  const raw = (
    process.env.CHANNEL_LINK_URL ??
    process.env.PUBLIC_CHANNEL_LINK ??
    process.env.NEXT_PUBLIC_CHANNEL_LINK ??
    ""
  ).trim();
  if (!raw || raw === "#") return undefined;
  try {
    const u = new URL(raw);
    if (u.protocol !== "https:" && u.protocol !== "http:") return undefined;
    return u.href;
  } catch {
    return undefined;
  }
}
