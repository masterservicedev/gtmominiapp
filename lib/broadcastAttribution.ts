/**
 * @deprecated Legacy inbound attribution — Chatwoot owns inbound replies now.
 * Still used by legacy bot handlers and reactivate confirm for broadcast_reply events.
 *
 * Attribute replies to the most recent re-engagement `broadcast_sent`.
 */
import { db } from "@/lib/db";
import { events } from "@/lib/db/schema";
import { RE_ENGAGEMENT_BROADCAST_TYPES } from "@/lib/reEngagementBroadcasts";
import { and, desc, eq, gte } from "drizzle-orm";

const ATTRIBUTION_WINDOW_DAYS = 30;
const ATTRIBUTION_TYPES = [...RE_ENGAGEMENT_BROADCAST_TYPES];
const TYPE_SET = new Set<string>([...ATTRIBUTION_TYPES]);

export type BroadcastSentMeta = {
  broadcastType: string;
  variant: string;
  nurtureQueueId?: string;
};

export async function findLatestReEngagementBroadcastSent(
  userId: string,
): Promise<BroadcastSentMeta | null> {
  const since = new Date(
    Date.now() - ATTRIBUTION_WINDOW_DAYS * 24 * 60 * 60 * 1000,
  );

  const recent = await db
    .select({ metadata: events.metadata })
    .from(events)
    .where(
      and(
        eq(events.userId, userId),
        eq(events.eventType, "broadcast_sent"),
        gte(events.createdAt, since),
      ),
    )
    .orderBy(desc(events.createdAt))
    .limit(40);

  for (const row of recent) {
    if (!row.metadata || typeof row.metadata !== "object") continue;
    const m = row.metadata as Record<string, unknown>;
    const bt = m.broadcastType;
    if (typeof bt !== "string" || !TYPE_SET.has(bt)) continue;
    const variant = typeof m.variant === "string" ? m.variant : "A";
    const nurtureQueueId =
      typeof m.nurtureQueueId === "string" ? m.nurtureQueueId : undefined;
    return { broadcastType: bt, variant, nurtureQueueId };
  }
  return null;
}

export async function logBroadcastReply(
  userId: string,
  telegramId: number,
  meta: BroadcastSentMeta,
  source: string,
  country: string | null,
) {
  await db.insert(events).values({
    userId,
    telegramId,
    eventType: "broadcast_reply",
    metadata: {
      broadcastType: meta.broadcastType,
      variant: meta.variant,
      nurtureQueueId: meta.nurtureQueueId,
      source,
    },
    country,
  });
}
