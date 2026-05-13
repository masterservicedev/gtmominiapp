import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * When ops open `/admin/...?secret=…`, send them through the gate so the HttpOnly
 * cookie is set, then return to the same admin path (without the secret in the URL).
 */
export function middleware(request: NextRequest) {
  const { pathname, searchParams } = request.nextUrl;
  if (!pathname.startsWith("/admin")) return NextResponse.next();

  const secret = searchParams.get("secret");
  if (!secret) return NextResponse.next();

  const dest = request.nextUrl.clone();
  dest.pathname = "/api/admin/gate";
  dest.search = "";
  dest.searchParams.set("secret", secret);

  const clean = request.nextUrl.clone();
  clean.searchParams.delete("secret");
  const nextPath = `${clean.pathname}${clean.search}`;
  dest.searchParams.set("next", nextPath);

  return NextResponse.redirect(dest);
}

export const config = {
  matcher: ["/admin", "/admin/:path*"],
};
