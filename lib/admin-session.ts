import crypto from "crypto";

const COOKIE_SALT = "gtmo-admin-cookie-v1";

/** HttpOnly cookie value derived from ADMIN_SECRET (never store the raw secret in a cookie). */
export function adminCookieToken(secret: string): string {
  return crypto.createHmac("sha256", secret).update(COOKIE_SALT).digest("hex");
}
