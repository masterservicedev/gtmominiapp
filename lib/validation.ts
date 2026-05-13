import crypto from "crypto";

export interface TelegramUser {
  id: number;
  first_name: string;
  last_name?: string;
  username?: string;
  language_code?: string;
  is_premium?: boolean;
}

export interface ValidatedInitData {
  user: TelegramUser;
  query_id?: string;
  auth_date: number;
  hash: string;
  /** Telegram Mini App `start_param` when opened via `?startapp=` / menu. */
  startParam?: string;
}

export function validateInitData(initData: string): ValidatedInitData {
  const params = new URLSearchParams(initData);
  const hash = params.get("hash");

  if (!hash) {
    throw new Error("Missing hash in initData");
  }

  params.delete("hash");

  const dataCheckString = Array.from(params.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, value]) => `${key}=${value}`)
    .join("\n");

  const secretKey = crypto
    .createHmac("sha256", "WebAppData")
    .update(process.env.TELEGRAM_BOT_TOKEN!)
    .digest();

  const expectedHash = crypto
    .createHmac("sha256", secretKey)
    .update(dataCheckString)
    .digest("hex");

  if (expectedHash !== hash) {
    throw new Error("Invalid initData hash — request rejected");
  }

  const authDate = parseInt(params.get("auth_date") || "0", 10);
  const now = Math.floor(Date.now() / 1000);
  if (now - authDate > 86400) {
    throw new Error("initData expired");
  }

  const userRaw = params.get("user");
  if (!userRaw) {
    throw new Error("Missing user in initData");
  }

  const user: TelegramUser = JSON.parse(decodeURIComponent(userRaw));

  return {
    user,
    query_id: params.get("query_id") || undefined,
    auth_date: authDate,
    hash,
    startParam: params.get("start_param") || undefined,
  };
}
