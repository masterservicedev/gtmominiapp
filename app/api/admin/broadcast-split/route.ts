import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { getBroadcastSplitStats, type BroadcastSplitStatRow } from "@/lib/admin-queries";
import {
  BROADCAST_SPLIT_TYPES,
  RE_ENGAGEMENT_LABELS,
  VARIANT_STRATEGY,
  type ReEngagementBroadcastType,
} from "@/lib/reEngagementBroadcasts";

type WinnerRow = {
  broadcastType: string;
  label: string;
  badge: "green" | "amber" | "grey";
  leadingVariant: string | null;
  note: string;
};

function computeWinners(
  stats: BroadcastSplitStatRow[],
): Record<string, WinnerRow> {
  const byType = new Map<string, BroadcastSplitStatRow[]>();
  for (const r of stats) {
    const list = byType.get(r.broadcastType) ?? [];
    list.push(r);
    byType.set(r.broadcastType, list);
  }

  const out: Record<string, WinnerRow> = {};
  for (const bt of BROADCAST_SPLIT_TYPES) {
    const label =
      RE_ENGAGEMENT_LABELS[bt as ReEngagementBroadcastType] ?? bt;
    const list = byType.get(bt) ?? [];
    const totalSent = list.reduce((s, x) => s + x.sentCount, 0);
    if (totalSent < 20) {
      out[bt] = {
        broadcastType: bt,
        label,
        badge: "grey",
        leadingVariant: null,
        note: "Insufficient data: fewer than 20 sends across all variants.",
      };
      continue;
    }
    const sorted = [...list].sort(
      (a, b) => (b.replyRatePct ?? -1) - (a.replyRatePct ?? -1),
    );
    const top = sorted[0];
    const second = sorted[1];
    if (!top || top.sentCount < 20) {
      out[bt] = {
        broadcastType: bt,
        label,
        badge: "grey",
        leadingVariant: top?.variant ?? null,
        note: "Leading variant needs at least 20 sends.",
      };
      continue;
    }
    const topRate = top.replyRatePct ?? 0;
    const secondRate = second ? (second.replyRatePct ?? 0) : -1;
    if (second == null || topRate - secondRate > 3) {
      out[bt] = {
        broadcastType: bt,
        label,
        badge: "green",
        leadingVariant: top.variant,
        note: `Clear leader: ${top.variant} at ${topRate}% vs next ${second ? `${second.variant} ${secondRate}%` : "n/a"}.`,
      };
    } else {
      out[bt] = {
        broadcastType: bt,
        label,
        badge: "amber",
        leadingVariant: top.variant,
        note: `Leading ${top.variant} (${topRate}%) within 3pp of runner-up — not decisive.`,
      };
    }
  }
  return out;
}

export async function GET(req: NextRequest) {
  const denied = requireAdmin(req);
  if (denied) return denied;

  const stats = await getBroadcastSplitStats();
  const winners = computeWinners(stats);

  return NextResponse.json({
    generatedAt: new Date().toISOString(),
    stats,
    winners,
    variantStrategy: VARIANT_STRATEGY,
    broadcastLabels: RE_ENGAGEMENT_LABELS,
  });
}
