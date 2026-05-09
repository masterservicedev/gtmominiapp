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
