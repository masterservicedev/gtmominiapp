import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { clampAdminDays, loadAdminAggregates } from "@/lib/admin-queries";
import { runInsightRules } from "@/lib/admin-insights";
import { countOpenUnassignedConversations } from "@/lib/chatwoot";

export async function GET(req: NextRequest) {
  const denied = requireAdmin(req);
  if (denied) return denied;

  const days = clampAdminDays(req.nextUrl.searchParams.get("days"));
  const [aggregates, chatwootOpenUnassigned] = await Promise.all([
    loadAdminAggregates(days),
    countOpenUnassignedConversations(),
  ]);

  const insights = runInsightRules(aggregates, chatwootOpenUnassigned);

  return NextResponse.json({
    days,
    aggregates,
    insights,
    chatwootOpenUnassigned,
    generatedAt: new Date().toISOString(),
  });
}
