/**
 * Railway worker config.
 * Mini App URLs: shared with Vercel via lib/config.ts.
 */
export { getMiniAppUrl, getMiniAppWebAppUrl } from "../../lib/config";

export function getBotToken(): string {
  return (process.env.TELEGRAM_BOT_TOKEN ?? "").trim();
}

/**
 * Public signals channel URL for outbound Telegram `url:` buttons.
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
