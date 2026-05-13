import crypto from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { adminCookieToken } from "@/lib/admin-session";

function timingSafeEqual(a: string, b: string): boolean {
  const ba = Buffer.from(a, "utf8");
  const bb = Buffer.from(b, "utf8");
  if (ba.length !== bb.length) return false;
  return crypto.timingSafeEqual(ba, bb);
}

export function verifyRawAdminSecret(candidate: string | null | undefined): boolean {
  const secret = process.env.ADMIN_SECRET;
  if (!secret || candidate == null) return false;
  return timingSafeEqual(candidate, secret);
}

/** Accepts `x-admin-secret` header or `admin_auth` cookie set by `/api/admin/gate`. */
export function verifyAdminRequest(req: NextRequest): boolean {
  const secret = process.env.ADMIN_SECRET;
  if (!secret) return false;

  const header = req.headers.get("x-admin-secret");
  if (header && timingSafeEqual(header, secret)) return true;

  const cookie = req.cookies.get("admin_auth")?.value;
  if (cookie && timingSafeEqual(cookie, adminCookieToken(secret))) return true;

  return false;
}

export function adminForbiddenResponse() {
  return NextResponse.json({ error: "Forbidden" }, { status: 403 });
}

export function requireAdmin(
  req: NextRequest,
): NextResponse | null {
  if (!verifyAdminRequest(req)) return adminForbiddenResponse();
  return null;
}
