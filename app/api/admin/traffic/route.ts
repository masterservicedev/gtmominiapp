import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import {
  clampAdminDays,
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

  const [bySource, byCampaign, byVariant, byCountry] = await Promise.all([
    getTrafficByUtmSource(days),
    getTrafficByUtmCampaign(days),
    getTrafficByEntryVariant(days),
    getTrafficByCountry(days, countryLimit),
  ]);

  return NextResponse.json({
    days,
    countryLimit,
    bySource,
    byCampaign,
    byVariant,
    byCountry,
    generatedAt: new Date().toISOString(),
  });
}
