import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import {
  clampAdminDays,
  getDepositorsInWindow,
  getTrafficByCountry,
  getTrafficByEntryVariant,
  getTrafficByUtmCampaign,
  getTrafficByUtmSource,
} from "@/lib/admin-queries";

export async function GET(req: NextRequest) {
  const denied = requireAdmin(req);
  if (denied) return denied;

  const days = clampAdminDays(req.nextUrl.searchParams.get("days"));
  const countryLimitRaw = req.nextUrl.searchParams.get("countryLimit");
  const countryLimit = countryLimitRaw
    ? Math.min(Math.max(parseInt(countryLimitRaw, 10) || 40, 1), 500)
    : 40;

  const [bySource, byCampaign, byVariant, byCountry, depositors] =
    await Promise.all([
      getTrafficByUtmSource(days),
      getTrafficByUtmCampaign(days),
      getTrafficByEntryVariant(days),
      getTrafficByCountry(days, countryLimit),
      getDepositorsInWindow(days, 500),
    ]);

  return NextResponse.json({
    days,
    countryLimit,
    bySource,
    byCampaign,
    byVariant,
    byCountry,
    depositors: depositors.map((row) => ({
      ...row,
      depositedAt: row.depositedAt.toISOString(),
    })),
    generatedAt: new Date().toISOString(),
  });
}
