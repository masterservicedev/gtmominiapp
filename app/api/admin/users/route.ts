import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import {
  getBundleStats,
  getNurtureRollup,
  getRecentEventsFeed,
  searchUsersForAdmin,
} from "@/lib/admin-queries";

export async function GET(req: NextRequest) {
  const denied = requireAdmin(req);
  if (denied) return denied;

  const sp = req.nextUrl.searchParams;
  const q = sp.get("q");
  if (q != null && q.trim() !== "") {
    const matches = await searchUsersForAdmin(q, 30);
    return NextResponse.json({
      mode: "search",
      matches,
      generatedAt: new Date().toISOString(),
    });
  }

  const [feed, nurture, bundle] = await Promise.all([
    getRecentEventsFeed(60),
    getNurtureRollup(),
    getBundleStats(),
  ]);

  return NextResponse.json({
    mode: "dashboard",
    feed,
    nurture,
    bundle,
    generatedAt: new Date().toISOString(),
  });
}
