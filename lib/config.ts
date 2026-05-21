/**
 * Shared Mini App URL helpers (Vercel + Railway worker).
 */

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
 * `WebApp.initDataUnsafe.start_param` inside the Mini App.
 */
export function getMiniAppWebAppUrl(
  startPayload?: string | null,
): string | undefined {
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
