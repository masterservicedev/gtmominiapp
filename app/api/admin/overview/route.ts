import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import {
  clampAdminDays,
  getCapitalDistributionFromLatestQuestionnaire,
  getFunnelDistinctByEvent,
  getOverviewTotals,
  getSegmentBreakdown,
  isValidCapital,
} from "@/lib/admin-queries";
import { getProductMatch } from "@/lib/productMatch";
import type { Capital } from "@/lib/scoring";

export async function GET(req: NextRequest) {
  const denied = requireAdmin(req);
  if (denied) return denied;

  const days = clampAdminDays(req.nextUrl.searchParams.get("days"));
  const [overview, funnel, segments, capitalRows] = await Promise.all([
    getOverviewTotals(days),
    getFunnelDistinctByEvent(days),
    getSegmentBreakdown(),
    getCapitalDistributionFromLatestQuestionnaire(),
  ]);

  const productsFromCapital = capitalRows
    .filter((r) => isValidCapital(r.capital))
    .map((r) => {
      const cap = r.capital as Capital;
      const match = getProductMatch(cap, true, false);
      return {
        capital: cap,
        count: r.count,
        productKey: match.productKey,
        primaryTitle: match.primaryTitle,
      };
    });

  return NextResponse.json({
    days,
    overview,
    funnel,
    segments,
    capital: capitalRows,
    productsFromCapital,
    generatedAt: new Date().toISOString(),
  });
}
