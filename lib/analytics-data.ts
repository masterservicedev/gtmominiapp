import { db } from "@/lib/db";
import { sql } from "drizzle-orm";

export async function getAnalyticsPayload() {
  const [usersByCountry, offerPerformance, conversionByCountry, segmentBreakdown] =
    await Promise.all([
      db.execute(sql`
        SELECT country, COUNT(*)::int as users
        FROM users
        WHERE country IS NOT NULL
        GROUP BY country
        ORDER BY users DESC
        LIMIT 20
      `),
      db.execute(sql`
        SELECT
          entry_variant as offer,
          COUNT(DISTINCT u.id)::int as users,
          COUNT(*) FILTER (WHERE e.event_type = 'offer_view')::int as views,
          COUNT(*) FILTER (WHERE e.event_type = 'offer_complete')::int as completes,
          COUNT(*) FILTER (WHERE e.event_type = 'funnel_gate_complete')::int as funnel_gate_complete,
          COUNT(*) FILTER (WHERE e.event_type = 'prelander_view')::int as prelander_views,
          COUNT(*) FILTER (WHERE e.event_type = 'prelander_complete')::int as prelander_completes,
          COUNT(*) FILTER (WHERE e.event_type = 'offer_watched')::int as offer_watched,
          COUNT(*) FILTER (WHERE e.event_type = 'questionnaire_start')::int as questionnaire_starts,
          COUNT(*) FILTER (WHERE e.event_type = 'questionnaire_processing_shown')::int as questionnaire_processing_shown,
          COUNT(*) FILTER (WHERE e.event_type = 'questionnaire_complete')::int as questionnaire_done,
          COUNT(*) FILTER (WHERE e.event_type = 'product_match_view')::int as product_match_views,
          COUNT(*) FILTER (WHERE e.event_type = 'intent_confirm')::int as intent_confirms,
          COUNT(*) FILTER (WHERE e.event_type = 'intent_decline')::int as intent_declines,
          COUNT(*) FILTER (WHERE e.event_type = 'handoff_confirmed')::int as handoff_confirmed,
          COUNT(*) FILTER (WHERE e.event_type = 'crm_triggered')::int as crm_leads
        FROM users u
        LEFT JOIN events e ON e.user_id = u.id
        GROUP BY entry_variant
      `),
      db.execute(sql`
        SELECT
          u.country,
          COUNT(DISTINCT u.id)::int as total_users,
          COUNT(DISTINCT u.id) FILTER (WHERE u.questionnaire_completed = true)::int as completed_q,
          COUNT(DISTINCT u.id) FILTER (WHERE u.crm_triggered = true)::int as crm_leads,
          COUNT(DISTINCT u.id) FILTER (WHERE u.segment = 'HIGH')::int as high_intent,
          COUNT(DISTINCT u.id) FILTER (WHERE u.segment = 'MID')::int as mid_intent
        FROM users u
        WHERE u.country IS NOT NULL
        GROUP BY u.country
        ORDER BY total_users DESC
        LIMIT 20
      `),
      db.execute(sql`
        SELECT
          segment,
          COUNT(*)::int as count,
          ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER (), 1)::float as percentage
        FROM users
        GROUP BY segment
      `),
    ]);

  return {
    usersByCountry: usersByCountry.rows,
    offerPerformance: offerPerformance.rows,
    conversionByCountry: conversionByCountry.rows,
    segmentBreakdown: segmentBreakdown.rows,
    generatedAt: new Date().toISOString(),
  };
}
