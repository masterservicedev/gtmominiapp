import { db } from "@/lib/db";
import { sql } from "drizzle-orm";
import { users, events, nurtureQueue } from "@/lib/db/schema";
import { desc, eq, ilike, or, and, asc, gte, lte, inArray } from "drizzle-orm";
import type { Capital } from "@/lib/scoring";
import type { EventType } from "@/lib/db/schema";
import {
  RE_ENGAGEMENT_BROADCAST_TYPES,
  RE_ENGAGEMENT_LABELS,
  type ReEngagementBroadcastType,
} from "@/lib/reEngagementBroadcasts";

export function clampAdminDays(raw: string | null | undefined): number {
  const n = raw != null ? Number.parseInt(String(raw), 10) : 7;
  if (!Number.isFinite(n)) return 7;
  return Math.min(Math.max(n, 1), 365);
}

export type FunnelStepRow = {
  event_type: string;
  distinct_users: number;
};

export type SegmentRow = { segment: string; count: number; percentage: number };

export type CapitalRow = { capital: string; count: number };

export type TrafficRow = { key: string | null; users: number };

/** New users in window by country, with deposit conversion among those signups. */
export type TrafficCountryRow = {
  key: string | null;
  users: number;
  depositCvr: number;
};

/** User with a deposit_confirmed event in the admin traffic time window. */
export type DepositorRow = {
  userId: string;
  telegramId: number;
  username: string | null;
  firstName: string | null;
  country: string | null;
  depositedAt: Date;
};

export type FeedRow = {
  id: string;
  event_type: string;
  created_at: Date;
  telegram_id: string;
  username: string | null;
  first_name: string | null;
  entry_variant: string | null;
  client_ip: string | null;
};

export type NurtureRow = {
  step: number;
  status: string | null;
  count: number;
};

export type OverviewTotals = {
  usersTotal: number;
  usersNewInWindow: number;
  questionnaireCompletedTotal: number;
  crmTriggeredTotal: number;
  depositsConfirmedWindow: number;
};

const FUNNEL_EVENT_TYPES: EventType[] = [
  "app_open",
  "questionnaire_start",
  "questionnaire_complete",
  "value_bridge_view",
  "product_match_view",
  "handoff_confirmed",
  "crm_triggered",
];

export async function getOverviewTotals(days: number): Promise<OverviewTotals> {
  const d = days;
  const { rows } = await db.execute(sql`
    SELECT
      (SELECT COUNT(*)::int FROM users) AS users_total,
      (SELECT COUNT(*)::int FROM users WHERE created_at > NOW() - (${d}::int * interval '1 day')) AS users_new,
      (SELECT COUNT(*)::int FROM users WHERE questionnaire_completed = true) AS q_done,
      (SELECT COUNT(*)::int FROM users WHERE crm_triggered = true) AS crm_done,
      (
        SELECT COUNT(DISTINCT e.user_id)::int
        FROM events e
        WHERE e.event_type = 'deposit_confirmed'
          AND e.created_at > NOW() - (${d}::int * interval '1 day')
      ) AS deposits_window
  `);
  const row = (rows[0] ?? {}) as Record<string, number>;
  return {
    usersTotal: row.users_total ?? 0,
    usersNewInWindow: row.users_new ?? 0,
    questionnaireCompletedTotal: row.q_done ?? 0,
    crmTriggeredTotal: row.crm_done ?? 0,
    depositsConfirmedWindow: row.deposits_window ?? 0,
  };
}

/** Distinct users per funnel event within the time window (single events scan — no row multiplication). */
export async function getFunnelDistinctByEvent(days: number): Promise<FunnelStepRow[]> {
  const d = days;
  const { rows } = await db.execute(sql`
    SELECT
      e.event_type::text AS event_type,
      COUNT(DISTINCT e.user_id)::int AS distinct_users
    FROM events e
    WHERE e.created_at > NOW() - (${d}::int * interval '1 day')
      AND e.event_type IN (
        'app_open',
        'questionnaire_start',
        'questionnaire_complete',
        'value_bridge_view',
        'product_match_view',
        'handoff_confirmed',
        'crm_triggered'
      )
    GROUP BY e.event_type
  `);
  const map = new Map(
    (rows as { event_type: string; distinct_users: number }[]).map((r) => [
      r.event_type,
      r.distinct_users,
    ]),
  );
  return FUNNEL_EVENT_TYPES.map((event_type) => ({
    event_type,
    distinct_users: map.get(event_type) ?? 0,
  }));
}

export async function getSegmentBreakdown(): Promise<SegmentRow[]> {
  const { rows } = await db.execute(sql`
    SELECT
      segment::text,
      COUNT(*)::int AS count,
      ROUND(COUNT(*) * 100.0 / NULLIF(SUM(COUNT(*)) OVER (), 0), 1)::float AS percentage
    FROM users
    GROUP BY segment
    ORDER BY count DESC
  `);
  return rows as unknown as SegmentRow[];
}

/** Latest questionnaire row per user, then aggregate by declared capital. */
export async function getCapitalDistributionFromLatestQuestionnaire(): Promise<
  CapitalRow[]
> {
  const { rows } = await db.execute(sql`
    WITH latest AS (
      SELECT DISTINCT ON (user_id) user_id, capital::text AS capital
      FROM questionnaire_answers
      ORDER BY user_id, created_at DESC
    )
    SELECT capital, COUNT(*)::int AS count
    FROM latest
    GROUP BY capital
    ORDER BY count DESC
  `);
  return rows as unknown as CapitalRow[];
}

export async function getTrafficByUtmSource(days: number): Promise<TrafficRow[]> {
  const d = days;
  const { rows } = await db.execute(sql`
    SELECT COALESCE(utm_source, '(none)')::text AS key, COUNT(*)::int AS users
    FROM users
    WHERE created_at > NOW() - (${d}::int * interval '1 day')
    GROUP BY utm_source
    ORDER BY users DESC
    LIMIT 40
  `);
  return rows as unknown as TrafficRow[];
}

export async function getTrafficByUtmCampaign(days: number): Promise<TrafficRow[]> {
  const d = days;
  const { rows } = await db.execute(sql`
    SELECT COALESCE(utm_campaign, '(none)')::text AS key, COUNT(*)::int AS users
    FROM users
    WHERE created_at > NOW() - (${d}::int * interval '1 day')
    GROUP BY utm_campaign
    ORDER BY users DESC
    LIMIT 40
  `);
  return rows as unknown as TrafficRow[];
}

export async function getTrafficByEntryVariant(days: number): Promise<TrafficRow[]> {
  const d = days;
  const { rows } = await db.execute(sql`
    SELECT COALESCE(entry_variant, '(none)')::text AS key, COUNT(*)::int AS users
    FROM users
    WHERE created_at > NOW() - (${d}::int * interval '1 day')
    GROUP BY entry_variant
    ORDER BY users DESC
    LIMIT 40
  `);
  return rows as unknown as TrafficRow[];
}

export async function getTrafficByCountry(
  days: number,
  rowLimit = 40,
): Promise<TrafficCountryRow[]> {
  const d = days;
  const lim = Math.min(Math.max(Math.floor(rowLimit), 1), 500);
  const { rows } = await db.execute(sql`
    SELECT
      COALESCE(country, '(unknown)')::text AS key,
      COUNT(*)::int AS users,
      ROUND(
        100.0 * COUNT(*) FILTER (WHERE COALESCE(deposit_total, 0) > 0)
          / NULLIF(COUNT(*), 0),
        0
      )::int AS deposit_cvr
    FROM users
    WHERE created_at > NOW() - (${d}::int * interval '1 day')
    GROUP BY country
    ORDER BY users DESC
    LIMIT ${lim}
  `);
  return (rows as { key: string; users: number; deposit_cvr: number }[]).map(
    (r) => ({
      key: r.key,
      users: r.users,
      depositCvr: r.deposit_cvr ?? 0,
    }),
  );
}

/**
 * Distinct users with at least one `deposit_confirmed` event in the window.
 * One row per user — the latest deposit event in that window.
 */
export async function getDepositorsInWindow(
  days: number,
  rowLimit = 500,
): Promise<DepositorRow[]> {
  const d = days;
  const lim = Math.min(Math.max(Math.floor(rowLimit), 1), 500);
  const { rows } = await db.execute(sql`
    SELECT
      user_id,
      telegram_id,
      username,
      first_name,
      country,
      deposited_at
    FROM (
      SELECT DISTINCT ON (e.user_id)
        u.id::text AS user_id,
        u.telegram_id::bigint AS telegram_id,
        u.username,
        u.first_name,
        COALESCE(u.country, '(unknown)')::text AS country,
        e.created_at AS deposited_at
      FROM events e
      INNER JOIN users u ON u.id = e.user_id
      WHERE e.event_type = 'deposit_confirmed'
        AND e.created_at > NOW() - (${d}::int * interval '1 day')
      ORDER BY e.user_id, e.created_at DESC
    ) latest
    ORDER BY deposited_at DESC
    LIMIT ${lim}
  `);
  return (
    rows as {
      user_id: string;
      telegram_id: string | number;
      username: string | null;
      first_name: string | null;
      country: string | null;
      deposited_at: Date;
    }[]
  ).map((r) => ({
    userId: r.user_id,
    telegramId: Number(r.telegram_id),
    username: r.username,
    firstName: r.first_name,
    country: r.country,
    depositedAt: r.deposited_at,
  }));
}

/** New users in window by IP captured at first `/api/init` (signup). */
export async function getTrafficBySignupIp(days: number): Promise<TrafficRow[]> {
  const d = days;
  const { rows } = await db.execute(sql`
    SELECT COALESCE(signup_ip, '(unknown)')::text AS key, COUNT(*)::int AS users
    FROM users
    WHERE created_at > NOW() - (${d}::int * interval '1 day')
    GROUP BY signup_ip
    ORDER BY users DESC
    LIMIT 40
  `);
  return rows as unknown as TrafficRow[];
}

/** Users with a session in the window, grouped by latest client IP. */
export async function getTrafficByLastSeenIp(days: number): Promise<TrafficRow[]> {
  const d = days;
  const { rows } = await db.execute(sql`
    SELECT COALESCE(last_seen_ip, '(unknown)')::text AS key, COUNT(*)::int AS users
    FROM users
    WHERE last_seen_at > NOW() - (${d}::int * interval '1 day')
    GROUP BY last_seen_ip
    ORDER BY users DESC
    LIMIT 40
  `);
  return rows as unknown as TrafficRow[];
}

export async function getRecentEventsFeed(limit: number): Promise<FeedRow[]> {
  const lim = Math.min(Math.max(limit, 1), 200);
  const { rows } = await db.execute(sql`
    SELECT
      e.id::text,
      e.event_type::text,
      e.created_at,
      e.telegram_id::text,
      u.username,
      u.first_name,
      u.entry_variant,
      (e.metadata->>'ip')::text AS client_ip
    FROM events e
    INNER JOIN users u ON u.id = e.user_id
    ORDER BY e.created_at DESC
    LIMIT ${lim}
  `);
  return rows as unknown as FeedRow[];
}

export async function getNurtureRollup(): Promise<NurtureRow[]> {
  const { rows } = await db.execute(sql`
    SELECT step, COALESCE(status, 'unknown')::text AS status, COUNT(*)::int AS count
    FROM nurture_queue
    GROUP BY step, status
    ORDER BY step ASC, status ASC
  `);
  return rows as unknown as NurtureRow[];
}

export async function getBundleStats() {
  const { rows } = await db.execute(sql`
    SELECT
      COUNT(*) FILTER (WHERE bundle_eligible = true)::int AS eligible,
      COUNT(*) FILTER (WHERE bundle_offer_shown = true)::int AS shown,
      COUNT(*) FILTER (WHERE bundle_accepted = true)::int AS accepted,
      COUNT(*) FILTER (WHERE bundle_used = true)::int AS used
    FROM users
  `);
  const r = (rows[0] ?? {}) as Record<string, number>;
  return {
    eligible: r.eligible ?? 0,
    shown: r.shown ?? 0,
    accepted: r.accepted ?? 0,
    used: r.used ?? 0,
  };
}

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function parseUserLookupId(raw: string): { kind: "telegram" | "uuid"; value: string } | null {
  const s = raw.trim();
  if (!s) return null;
  if (/^\d+$/.test(s)) return { kind: "telegram", value: s };
  if (UUID_RE.test(s)) return { kind: "uuid", value: s };
  return null;
}

export async function getUserForAdminLookup(parsed: {
  kind: "telegram" | "uuid";
  value: string;
}) {
  if (parsed.kind === "uuid") {
    const [row] = await db.select().from(users).where(eq(users.id, parsed.value)).limit(1);
    return row ?? null;
  }
  const tid = Number(parsed.value);
  if (!Number.isSafeInteger(tid)) return null;
  const [row] = await db.select().from(users).where(eq(users.telegramId, tid)).limit(1);
  return row ?? null;
}

export async function getEventsTimelineForUser(userId: string, limit: number) {
  const lim = Math.min(Math.max(limit, 1), 200);
  return db
    .select({
      id: events.id,
      eventType: events.eventType,
      createdAt: events.createdAt,
      metadata: events.metadata,
    })
    .from(events)
    .where(eq(events.userId, userId))
    .orderBy(desc(events.createdAt))
    .limit(lim);
}

/** HIGH completed questionnaire but no handoff_confirmed in `staleDays`. */
export async function countStaleHighNoHandoff(staleDays: number): Promise<number> {
  const sd = Math.min(Math.max(staleDays, 1), 90);
  const { rows } = await db.execute(sql`
    SELECT COUNT(*)::int AS n
    FROM users u
    WHERE u.questionnaire_completed = true
      AND u.segment = 'HIGH'
      AND NOT EXISTS (
        SELECT 1
        FROM events e
        WHERE e.user_id = u.id
          AND e.event_type = 'handoff_confirmed'
          AND e.created_at > NOW() - (${sd}::int * interval '1 day')
      )
  `);
  return Number((rows[0] as { n?: number } | undefined)?.n ?? 0);
}

/** MID completed questionnaire but never confirmed intent (step 9) within `staleDays` of scoring. */
export async function countStaleMidNoIntentConfirm(staleDays: number): Promise<number> {
  const sd = Math.min(Math.max(staleDays, 1), 90);
  const { rows } = await db.execute(sql`
    SELECT COUNT(*)::int AS n
    FROM users u
    WHERE u.questionnaire_completed = true
      AND u.segment = 'MID'
      AND u.intent_confirmed_at IS NULL
      AND u.questionnaire_completed_at IS NOT NULL
      AND u.questionnaire_completed_at < NOW() - (${sd}::int * interval '1 day')
  `);
  return Number((rows[0] as { n?: number } | undefined)?.n ?? 0);
}

export async function getQuestionnaireEventDropoff(days: number): Promise<{
  started: number;
  completed: number;
}> {
  const d = days;
  const { rows } = await db.execute(sql`
    SELECT
      COUNT(DISTINCT CASE WHEN e.event_type = 'questionnaire_start' THEN e.user_id END)::int AS started,
      COUNT(DISTINCT CASE WHEN e.event_type = 'questionnaire_complete' THEN e.user_id END)::int AS completed
    FROM events e
    WHERE e.created_at > NOW() - (${d}::int * interval '1 day')
  `);
  const r = rows[0] as { started?: number; completed?: number };
  return { started: r.started ?? 0, completed: r.completed ?? 0 };
}

export async function countBundleEligibleQuestionnaireNoOffer(): Promise<number> {
  const { rows } = await db.execute(sql`
    SELECT COUNT(*)::int AS n
    FROM users u
    WHERE u.bundle_eligible = true
      AND u.questionnaire_completed = true
      AND COALESCE(u.bundle_offer_shown, false) = false
  `);
  return Number((rows[0] as { n?: number } | undefined)?.n ?? 0);
}

/** Share of new users (in window) on the top utm_source key (excluding null). */
export async function getTopUtmSourceConcentration(days: number): Promise<{
  topKey: string | null;
  topUsers: number;
  windowUsers: number;
  ratio: number;
}> {
  const d = days;
  const { rows } = await db.execute(sql`
    WITH w AS (
      SELECT utm_source, COUNT(*)::int AS c
      FROM users
      WHERE created_at > NOW() - (${d}::int * interval '1 day')
      GROUP BY utm_source
    ),
    top AS (
      SELECT utm_source, c
      FROM w
      WHERE utm_source IS NOT NULL
      ORDER BY c DESC
      LIMIT 1
    ),
    total AS (SELECT COALESCE(SUM(c), 0)::int AS t FROM w)
    SELECT
      (SELECT utm_source::text FROM top) AS top_key,
      (SELECT c FROM top) AS top_users,
      (SELECT t FROM total) AS window_users
  `);
  const r = rows[0] as {
    top_key?: string | null;
    top_users?: number | null;
    window_users?: number | null;
  };
  const windowUsers = r.window_users ?? 0;
  const topUsers = r.top_users ?? 0;
  const ratio = windowUsers > 0 ? topUsers / windowUsers : 0;
  return {
    topKey: r.top_key ?? null,
    topUsers,
    windowUsers,
    ratio,
  };
}

export async function countOverdueNurturePending(): Promise<number> {
  const { rows } = await db.execute(sql`
    SELECT COUNT(*)::int AS n
    FROM nurture_queue
    WHERE status = 'pending'
      AND scheduled_at < NOW() - interval '2 hours'
  `);
  return Number((rows[0] as { n?: number } | undefined)?.n ?? 0);
}

export async function getDistinctUsersWithEvent(
  eventType: EventType,
  days: number,
): Promise<number> {
  const d = days;
  const { rows } = await db.execute(sql`
    SELECT COUNT(DISTINCT e.user_id)::int AS n
    FROM events e
    WHERE e.event_type = ${eventType}
      AND e.created_at > NOW() - (${d}::int * interval '1 day')
  `);
  return Number((rows[0] as { n?: number } | undefined)?.n ?? 0);
}

export type AdminAggregates = {
  days: number;
  overview: OverviewTotals;
  funnel: FunnelStepRow[];
  segments: SegmentRow[];
  capital: CapitalRow[];
  questionnaireDropoff: { started: number; completed: number };
  staleHandoffHigh: number;
  staleMidNoIntentConfirm: number;
  bundleEligibleNoOffer: number;
  topUtm: Awaited<ReturnType<typeof getTopUtmSourceConcentration>>;
  overdueNurture: number;
  crmEventUsers: number;
  appOpenUsers: number;
};

export async function loadAdminAggregates(days: number): Promise<AdminAggregates> {
  const [
    overview,
    funnel,
    segments,
    capital,
    questionnaireDropoff,
    staleHandoffHigh,
    staleMidNoIntentConfirm,
    bundleEligibleNoOffer,
    topUtm,
    overdueNurture,
    crmEventUsers,
    appOpenUsers,
  ] = await Promise.all([
    getOverviewTotals(days),
    getFunnelDistinctByEvent(days),
    getSegmentBreakdown(),
    getCapitalDistributionFromLatestQuestionnaire(),
    getQuestionnaireEventDropoff(days),
    countStaleHighNoHandoff(14),
    countStaleMidNoIntentConfirm(14),
    countBundleEligibleQuestionnaireNoOffer(),
    getTopUtmSourceConcentration(days),
    countOverdueNurturePending(),
    getDistinctUsersWithEvent("crm_triggered", days),
    getDistinctUsersWithEvent("app_open", days),
  ]);

  return {
    days,
    overview,
    funnel,
    segments,
    capital,
    questionnaireDropoff,
    staleHandoffHigh,
    staleMidNoIntentConfirm,
    bundleEligibleNoOffer,
    topUtm,
    overdueNurture,
    crmEventUsers,
    appOpenUsers,
  };
}

export function isValidCapital(c: string): c is Capital {
  return (
    c === "under_100" ||
    c === "100_300" ||
    c === "300_1000" ||
    c === "1000_plus"
  );
}

export function clampAdminReEngagementDays(
  raw: string | null | undefined,
): number {
  const n = raw != null ? Number.parseInt(String(raw), 10) : 14;
  if (!Number.isFinite(n)) return 14;
  return Math.min(Math.max(n, 1), 90);
}

export type UpcomingReEngagementRow = {
  queueId: string;
  userId: string;
  telegramId: number;
  firstName: string | null;
  username: string | null;
  segment: string | null;
  crmTriggered: boolean | null;
  bundleEligible: boolean | null;
  bundleUsed: boolean | null;
  confirmedProductKey: string | null;
  scheduledAt: Date;
  broadcastType: string | null;
  nurtureKind: string | null;
  step: number;
  messageVariant: string | null;
};

/** Pending re-engagement / broadcast queue rows in the next `withinDays` (from now). */
export async function getUpcomingReEngagementQueue(
  withinDays: number,
): Promise<UpcomingReEngagementRow[]> {
  const now = new Date();
  const end = new Date(
    now.getTime() + Math.min(Math.max(withinDays, 1), 90) * 24 * 60 * 60 * 1000,
  );

  const rows = await db
    .select({
      queueId: nurtureQueue.id,
      userId: users.id,
      telegramId: users.telegramId,
      firstName: users.firstName,
      username: users.username,
      segment: users.segment,
      crmTriggered: users.crmTriggered,
      bundleEligible: users.bundleEligible,
      bundleUsed: users.bundleUsed,
      confirmedProductKey: users.confirmedProductKey,
      scheduledAt: nurtureQueue.scheduledAt,
      broadcastType: nurtureQueue.broadcastType,
      nurtureKind: nurtureQueue.nurtureKind,
      step: nurtureQueue.step,
      messageVariant: nurtureQueue.messageVariant,
    })
    .from(nurtureQueue)
    .innerJoin(users, eq(nurtureQueue.userId, users.id))
    .where(
      and(
        eq(nurtureQueue.status, "pending"),
        inArray(nurtureQueue.broadcastType, [...RE_ENGAGEMENT_BROADCAST_TYPES]),
        gte(nurtureQueue.scheduledAt, now),
        lte(nurtureQueue.scheduledAt, end),
      ),
    )
    .orderBy(asc(nurtureQueue.scheduledAt))
    .limit(500);

  return rows.map((r) => ({
    queueId: String(r.queueId),
    userId: String(r.userId),
    telegramId: Number(r.telegramId),
    firstName: r.firstName,
    username: r.username,
    segment: r.segment ?? null,
    crmTriggered: r.crmTriggered,
    bundleEligible: r.bundleEligible,
    bundleUsed: r.bundleUsed,
    confirmedProductKey: r.confirmedProductKey,
    scheduledAt: r.scheduledAt!,
    broadcastType: r.broadcastType,
    nurtureKind: r.nurtureKind,
    step: r.step,
    messageVariant: r.messageVariant,
  }));
}

export type BroadcastSplitStatRow = {
  broadcastType: string;
  variant: string;
  sentCount: number;
  replyCount: number;
  replyRatePct: number | null;
};

export type BroadcastSendStatRow = {
  broadcastType: ReEngagementBroadcastType;
  label: string;
  sentCount: number;
};

/** `broadcast_sent` events in the last `days`, grouped by nurture broadcast type. */
export async function getBroadcastSendsByType(
  days: number,
): Promise<BroadcastSendStatRow[]> {
  const d = Math.min(Math.max(days, 1), 90);
  const types = [...RE_ENGAGEMENT_BROADCAST_TYPES];
  const { rows } = await db.execute(sql`
    SELECT
      metadata->>'broadcastType' AS broadcast_type,
      COUNT(*)::int AS sent_count
    FROM events
    WHERE event_type = 'broadcast_sent'
      AND created_at > NOW() - (${d}::int * interval '1 day')
      AND metadata->>'broadcastType' IN (
        'high_day2', 'high_day5', 'mid_day3', 'mid_day10', 'low_day7'
      )
    GROUP BY 1
  `);
  const byType = new Map<string, number>();
  for (const row of rows as { broadcast_type?: string; sent_count?: number }[]) {
    if (row.broadcast_type) {
      byType.set(row.broadcast_type, row.sent_count ?? 0);
    }
  }
  return types.map((bt) => ({
    broadcastType: bt,
    label: RE_ENGAGEMENT_LABELS[bt],
    sentCount: byType.get(bt) ?? 0,
  }));
}

/** @deprecated A/B split removed — use getBroadcastSendsByType. */
export async function getBroadcastSplitStats(): Promise<BroadcastSplitStatRow[]> {
  const { rows } = await db.execute(sql`
    SELECT
      sent.broadcast_type AS "broadcastType",
      sent.variant AS "variant",
      sent.sent_count::int AS "sentCount",
      COALESCE(replied.reply_count, 0)::int AS "replyCount",
      CASE WHEN sent.sent_count > 0
        THEN ROUND(COALESCE(replied.reply_count, 0) * 100.0 / sent.sent_count, 1)::float
        ELSE NULL
      END AS "replyRatePct"
    FROM (
      SELECT
        metadata->>'broadcastType' AS broadcast_type,
        metadata->>'variant' AS variant,
        COUNT(*)::int AS sent_count
      FROM events
      WHERE event_type = 'broadcast_sent'
        AND metadata->>'broadcastType' IS NOT NULL
        AND metadata->>'variant' IS NOT NULL
        AND metadata->>'broadcastType' IN (
          'high_day2', 'high_day5', 'mid_day3', 'mid_day10', 'low_day7'
        )
      GROUP BY 1, 2
    ) sent
    LEFT JOIN (
      SELECT
        metadata->>'broadcastType' AS broadcast_type,
        metadata->>'variant' AS variant,
        COUNT(*)::int AS reply_count
      FROM events
      WHERE event_type = 'broadcast_reply'
      GROUP BY 1, 2
    ) replied
      ON sent.broadcast_type = replied.broadcast_type
      AND sent.variant = replied.variant
    ORDER BY sent.broadcast_type, sent.variant
  `);
  return rows as unknown as BroadcastSplitStatRow[];
}

/** Fuzzy search: telegram id exact if numeric, else prefix match on username / first_name. */
export async function searchUsersForAdmin(q: string, limit: number) {
  const lim = Math.min(Math.max(limit, 1), 50);
  const term = q.trim();
  if (!term) return [];

  if (/^\d+$/.test(term)) {
    const tid = Number(term);
    if (!Number.isSafeInteger(tid)) return [];
    return db.select().from(users).where(eq(users.telegramId, tid)).limit(lim);
  }

  const safe = term.replace(/%/g, "").replace(/_/g, "");
  if (!safe) return [];
  const pattern = `%${safe}%`;
  return db
    .select()
    .from(users)
    .where(or(ilike(users.username, pattern), ilike(users.firstName, pattern)))
    .orderBy(desc(users.lastSeenAt))
    .limit(lim);
}
