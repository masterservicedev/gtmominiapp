import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import {
  clampAdminReEngagementDays,
  getUpcomingReEngagementQueue,
} from "@/lib/admin-queries";
import {
  buildReEngagementAdminHint,
  buildReEngagementTelegramBody,
  isReEngagementBroadcastType,
  RE_ENGAGEMENT_LABELS,
  telegramBodyToAdminPlain,
  normalizeMessageVariant,
} from "@/lib/reEngagementBroadcasts";

export async function GET(req: NextRequest) {
  const denied = requireAdmin(req);
  if (denied) return denied;

  const days = clampAdminReEngagementDays(
    req.nextUrl.searchParams.get("days"),
  );
  const rows = await getUpcomingReEngagementQueue(days);

  const counts: Record<string, number> = {};
  for (const r of rows) {
    const k = r.broadcastType ?? "unknown";
    counts[k] = (counts[k] ?? 0) + 1;
  }

  const items = rows.map((r) => {
    const bt = r.broadcastType;
    const label =
      bt && isReEngagementBroadcastType(bt) ? RE_ENGAGEMENT_LABELS[bt] : bt ?? "—";
    const previewIn =
      bt && isReEngagementBroadcastType(bt)
        ? {
            firstName: r.firstName,
            confirmedProductKey: r.confirmedProductKey,
            bundleEligible: r.bundleEligible ?? false,
            bundleUsed: r.bundleUsed ?? false,
          }
        : null;
    const variant = normalizeMessageVariant();
    const telegram =
      previewIn && bt && isReEngagementBroadcastType(bt)
        ? buildReEngagementTelegramBody(bt, previewIn)
        : "";
    const adminHint =
      bt && isReEngagementBroadcastType(bt)
        ? buildReEngagementAdminHint(bt)
        : "";
    return {
      queueId: r.queueId,
      userId: r.userId,
      telegramId: r.telegramId,
      username: r.username,
      firstName: r.firstName,
      segment: r.segment,
      crmTriggered: r.crmTriggered,
      scheduledAt: r.scheduledAt.toISOString(),
      broadcastType: r.broadcastType,
      nurtureKind: r.nurtureKind,
      step: r.step,
      campaignLabel: label,
      messageVariant: variant,
      messageMarkdown: telegram,
      messagePlain: telegram ? telegramBodyToAdminPlain(telegram) : "",
      adminHint,
    };
  });

  return NextResponse.json({
    days,
    generatedAt: new Date().toISOString(),
    total: items.length,
    countsByBroadcastType: counts,
    items,
  });
}
