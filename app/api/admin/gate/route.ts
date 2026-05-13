import { NextRequest, NextResponse } from "next/server";
import { adminCookieToken } from "@/lib/admin-session";
import { verifyRawAdminSecret } from "@/lib/admin-auth";

function safeAdminNextPath(raw: string | null, origin: string): URL {
  if (!raw || !raw.startsWith("/")) {
    return new URL("/admin", origin);
  }
  try {
    const u = new URL(raw, origin);
    if (!u.pathname.startsWith("/admin")) {
      return new URL("/admin", origin);
    }
    return u;
  } catch {
    return new URL("/admin", origin);
  }
}

export async function GET(req: NextRequest) {
  const secretParam = req.nextUrl.searchParams.get("secret");
  if (!verifyRawAdminSecret(secretParam)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const envSecret = process.env.ADMIN_SECRET!;
  const token = adminCookieToken(envSecret);
  const target = safeAdminNextPath(
    req.nextUrl.searchParams.get("next"),
    req.url,
  );
  const res = NextResponse.redirect(target);
  res.cookies.set("admin_auth", token, {
    httpOnly: true,
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
  });
  return res;
}
