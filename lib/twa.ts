export type TelegramWebApp = typeof import("@twa-dev/sdk").default;

export async function loadWebApp(): Promise<TelegramWebApp> {
  const { default: WebApp } = await import("@twa-dev/sdk");
  return WebApp;
}
