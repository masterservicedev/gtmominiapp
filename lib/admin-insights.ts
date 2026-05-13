import type { AdminAggregates } from "@/lib/admin-queries";

export type AdminInsight = {
  id: string;
  severity: "info" | "warning" | "critical";
  title: string;
  detail: string;
};

/**
 * Rules-based ops signals. Inputs come from `loadAdminAggregates` plus optional Chatwoot.
 * Thresholds are heuristic — tune as you learn baseline traffic.
 */
export function runInsightRules(
  a: AdminAggregates,
  chatwootOpenUnassigned: number | null,
): AdminInsight[] {
  const insights: AdminInsight[] = [];

  if (a.staleHandoffMidHigh >= 5) {
    insights.push({
      id: "stale-handoff-mid-high",
      severity: a.staleHandoffMidHigh >= 25 ? "critical" : "warning",
      title: "Qualified users without recent handoff",
      detail: `${a.staleHandoffMidHigh} HIGH/MID users completed the questionnaire but have no handoff_confirmed event in the last 14 days.`,
    });
  }

  const { started, completed } = a.questionnaireDropoff;
  if (started >= 30) {
    const rate = completed / started;
    if (rate < 0.35) {
      insights.push({
        id: "questionnaire-dropoff",
        severity: rate < 0.2 ? "critical" : "warning",
        title: "Questionnaire completion rate is low",
        detail: `In the last ${a.days} days, ${completed} of ${started} distinct users who started the questionnaire completed it (${(rate * 100).toFixed(0)}%).`,
      });
    }
  }

  if (a.bundleEligibleNoOffer >= 15) {
    insights.push({
      id: "bundle-no-offer",
      severity: "warning",
      title: "Bundle-eligible users not seeing an offer",
      detail: `${a.bundleEligibleNoOffer} users are bundle-eligible, marked questionnaire complete, but bundle_offer_shown is false.`,
    });
  }

  if (chatwootOpenUnassigned != null) {
    if (chatwootOpenUnassigned >= 20) {
      insights.push({
        id: "chatwoot-unassigned",
        severity: "critical",
        title: "Chatwoot open unassigned queue",
        detail: `Approximately ${chatwootOpenUnassigned} open conversation(s) with no assignee (first page / meta count from Chatwoot).`,
      });
    } else if (chatwootOpenUnassigned >= 8) {
      insights.push({
        id: "chatwoot-unassigned-warn",
        severity: "warning",
        title: "Chatwoot unassigned backlog building",
        detail: `${chatwootOpenUnassigned} open unassigned conversation(s).`,
      });
    }
  } else {
    insights.push({
      id: "chatwoot-unassigned-skip",
      severity: "info",
      title: "Chatwoot unassigned count unavailable",
      detail:
        "Could not read open/unassigned conversations from Chatwoot (credentials, API shape, or network). Other rules still apply.",
    });
  }

  if (a.topUtm.windowUsers >= 40 && a.topUtm.topKey && a.topUtm.ratio >= 0.72) {
    insights.push({
      id: "utm-concentration",
      severity: "warning",
      title: "Acquisition concentrated on one UTM source",
      detail: `In the last ${a.days} days, "${a.topUtm.topKey}" accounts for ${(a.topUtm.ratio * 100).toFixed(0)}% of new users (${a.topUtm.topUsers} / ${a.topUtm.windowUsers}).`,
    });
  }

  if (a.overdueNurture >= 10) {
    insights.push({
      id: "nurture-overdue",
      severity: a.overdueNurture >= 40 ? "critical" : "warning",
      title: "Overdue nurture sends",
      detail: `${a.overdueNurture} nurture_queue rows are still pending more than 2 hours after scheduled_at.`,
    });
  }

  const crmRate = a.appOpenUsers > 0 ? a.crmEventUsers / a.appOpenUsers : 0;
  if (a.appOpenUsers >= 200 && crmRate < 0.04) {
    insights.push({
      id: "crm-vs-opens",
      severity: "info",
      title: "CRM events are a small share of recent opens",
      detail: `Last ${a.days} days: ${a.crmEventUsers} distinct users with crm_triggered vs ${a.appOpenUsers} with app_open (${(crmRate * 100).toFixed(1)}%).`,
    });
  }

  return insights;
}
