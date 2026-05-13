"use client";

import { useCallback, useEffect, useState } from "react";
import { AutoRefresh } from "./_components/AutoRefresh";
import { adminApi } from "./_components/adminApi";

type OverviewPayload = {
  days: number;
  overview: {
    usersTotal: number;
    usersNewInWindow: number;
    questionnaireCompletedTotal: number;
    crmTriggeredTotal: number;
    depositsConfirmedWindow: number;
  };
  funnel: { event_type: string; distinct_users: number }[];
  segments: { segment: string; count: number; percentage: number }[];
  capital: { capital: string; count: number }[];
  productsFromCapital: {
    capital: string;
    count: number;
    productKey: string;
    primaryTitle: string;
  }[];
};

const FUNNEL_LABELS: Record<string, string> = {
  app_open: "App opened",
  questionnaire_start: "Questionnaire started",
  questionnaire_complete: "Questionnaire completed",
  value_bridge_view: "Value bridge viewed",
  product_match_view: "Product match viewed",
  handoff_confirmed: "Handoff confirmed",
  crm_triggered: "CRM lead sent",
  deposit_confirmed: "Deposit confirmed",
  broadcast_sent: "Broadcast sent",
  broadcast_reply: "Broadcast reply",
  reactivation_confirm: "Reactivation confirmed",
};

const FUNNEL_COLORS: Record<string, string> = {
  app_open: "#3B8BD4",
  questionnaire_start: "#3B8BD4",
  questionnaire_complete: "#1D9E75",
  value_bridge_view: "#7F77DD",
  product_match_view: "#5B9BD5",
  handoff_confirmed: "#1D9E75",
  crm_triggered: "#EF9F27",
  deposit_confirmed: "#E24B4A",
  broadcast_sent: "#7F77DD",
  broadcast_reply: "#9B7FD8",
  reactivation_confirm: "#1D9E75",
};

const SEGMENT_CONFIG: Record<
  string,
  { color: string; bg: string; label: string }
> = {
  HIGH: { color: "#E24B4A", bg: "rgba(226,75,74,0.08)", label: "High intent" },
  MID: { color: "#EF9F27", bg: "rgba(239,159,39,0.08)", label: "Mid intent" },
  LOW: { color: "#888780", bg: "rgba(136,135,128,0.08)", label: "Low intent" },
  UNSCORED: { color: "#5F5E5A", bg: "rgba(95,94,90,0.06)", label: "Unscored" },
};

const PRODUCT_COLORS = ["#1D9E75", "#3B8BD4", "#EF9F27", "#7F77DD", "#D85A30"];

function fmt(n: number) {
  return n >= 1000 ? `${(n / 1000).toFixed(1)}k` : String(n);
}

function pct(a: number, b: number) {
  if (!b) return "—";
  return `${Math.round((a / b) * 100)}%`;
}

export default function AdminOverviewPage() {
  const [days, setDays] = useState(7);
  const [data, setData] = useState<OverviewPayload | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const load = useCallback(async () => {
    setErr(null);
    const res = await adminApi(`/api/admin/overview?days=${days}`);
    if (!res.ok) {
      setErr(res.status === 403 ? "Access denied" : `Error ${res.status}`);
      return;
    }
    setData(await res.json());
    setLastUpdated(new Date());
  }, [days]);

  useEffect(() => {
    void load();
  }, [load]);

  const o = data?.overview;
  const funnelMax =
    data?.funnel.reduce((m, r) => Math.max(m, r.distinct_users), 0) ?? 0;
  const topSegment = data
    ? [...data.segments].sort((a, b) => b.count - a.count)[0]
    : undefined;
  const productMax =
    data?.productsFromCapital.reduce((m, r) => Math.max(m, r.count), 0) ?? 0;

  const closePct = o ? pct(o.depositsConfirmedWindow, o.crmTriggeredTotal) : "—";

  return (
    <div>
      <div
        style={{
          display: "flex",
          alignItems: "flex-end",
          justifyContent: "space-between",
          marginBottom: 28,
          flexWrap: "wrap",
          gap: 12,
        }}
      >
        <div>
          <div
            style={{
              fontSize: 11,
              fontWeight: 600,
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              color: "#1D9E75",
              marginBottom: 6,
            }}
          >
            GTMO Admin
          </div>
          <h1
            style={{
              fontSize: 22,
              fontWeight: 600,
              color: "#fff",
              margin: 0,
              letterSpacing: "-0.02em",
            }}
          >
            Overview
          </h1>
          {lastUpdated && (
            <div style={{ fontSize: 12, color: "#5F5E5A", marginTop: 4 }}>
              Updated{" "}
              {lastUpdated.toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </div>
          )}
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <select
            value={days}
            onChange={(e) => setDays(Number(e.target.value))}
            style={{
              background: "#1a1a1a",
              border: "0.5px solid #2a2a2a",
              borderRadius: 8,
              color: "#ccc",
              fontSize: 13,
              padding: "7px 12px",
              cursor: "pointer",
              outline: "none",
            }}
          >
            <option value={7}>Last 7 days</option>
            <option value={30}>Last 30 days</option>
            <option value={90}>Last 90 days</option>
          </select>
          <AutoRefresh intervalMs={60_000} onTick={load} />
        </div>
      </div>

      {err && (
        <div
          style={{
            background: "rgba(226,75,74,0.08)",
            border: "0.5px solid rgba(226,75,74,0.3)",
            borderRadius: 10,
            padding: "12px 16px",
            color: "#E24B4A",
            fontSize: 13,
            marginBottom: 24,
          }}
        >
          {err}
        </div>
      )}

      {!data ? (
        <div style={{ color: "#5F5E5A", fontSize: 13 }}>Loading…</div>
      ) : (
        <>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
              gap: 10,
              marginBottom: 28,
            }}
          >
            {[
              {
                label: "Total users",
                value: fmt(o!.usersTotal),
                sub: `${fmt(o!.usersNewInWindow)} new in ${days}d`,
                subColor: "#1D9E75",
              },
              {
                label: "Questionnaires done",
                value: fmt(o!.questionnaireCompletedTotal),
                sub:
                  pct(o!.questionnaireCompletedTotal, o!.usersTotal) + " of total",
                subColor: "#5F5E5A",
              },
              {
                label: "CRM leads sent",
                value: fmt(o!.crmTriggeredTotal),
                sub:
                  pct(o!.crmTriggeredTotal, o!.questionnaireCompletedTotal) +
                  " of Q'naire",
                subColor: "#5F5E5A",
              },
              {
                label: "Deposits confirmed",
                value: fmt(o!.depositsConfirmedWindow),
                sub: `Close rate: ${closePct}`,
                subColor:
                  o!.depositsConfirmedWindow > 0 ? "#1D9E75" : "#5F5E5A",
              },
              {
                label: "Dominant segment",
                value: topSegment
                  ? SEGMENT_CONFIG[topSegment.segment]?.label ||
                    topSegment.segment
                  : "—",
                sub: topSegment
                  ? `${topSegment.count} users · ${topSegment.percentage}%`
                  : "",
                subColor: topSegment
                  ? SEGMENT_CONFIG[topSegment.segment]?.color || "#5F5E5A"
                  : "#5F5E5A",
              },
            ].map((card, i) => (
              <div
                key={i}
                style={{
                  background: "#111",
                  border: "0.5px solid #1e1e1e",
                  borderRadius: 12,
                  padding: "18px 20px",
                }}
              >
                <div
                  style={{
                    fontSize: 11,
                    fontWeight: 500,
                    color: "#5F5E5A",
                    textTransform: "uppercase",
                    letterSpacing: "0.07em",
                    marginBottom: 8,
                  }}
                >
                  {card.label}
                </div>
                <div
                  style={{
                    fontSize: 26,
                    fontWeight: 600,
                    color: "#fff",
                    letterSpacing: "-0.03em",
                    lineHeight: 1,
                    marginBottom: 6,
                  }}
                >
                  {card.value}
                </div>
                <div style={{ fontSize: 12, color: card.subColor }}>{card.sub}</div>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 gap-3 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)] lg:gap-3 mb-3">
            <div
              style={{
                background: "#111",
                border: "0.5px solid #1e1e1e",
                borderRadius: 12,
                padding: "20px 24px",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  marginBottom: 20,
                }}
              >
                <div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: "#fff" }}>
                    Funnel drop-off
                  </div>
                  <div style={{ fontSize: 12, color: "#5F5E5A", marginTop: 2 }}>
                    Distinct users per stage — {days}d
                  </div>
                </div>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                {data.funnel.map((row, i) => {
                  const barPct = funnelMax
                    ? (row.distinct_users / funnelMax) * 100
                    : 0;
                  const prevRow = data.funnel[i - 1];
                  const dropPct =
                    prevRow && prevRow.distinct_users > 0
                      ? Math.round(
                          (1 -
                            row.distinct_users / prevRow.distinct_users) *
                            100,
                        )
                      : null;

                  return (
                    <div key={row.event_type}>
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          marginBottom: 6,
                        }}
                      >
                        <div style={{ fontSize: 12, color: "#888780" }}>
                          {FUNNEL_LABELS[row.event_type] || row.event_type}
                        </div>
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 10,
                          }}
                        >
                          {dropPct !== null && dropPct > 0 && (
                            <div
                              style={{
                                fontSize: 11,
                                color: dropPct > 40 ? "#E24B4A" : "#888780",
                                background:
                                  dropPct > 40
                                    ? "rgba(226,75,74,0.08)"
                                    : "transparent",
                                borderRadius: 4,
                                padding: "1px 6px",
                              }}
                            >
                              ↓ {dropPct}%
                            </div>
                          )}
                          <div
                            style={{
                              fontSize: 13,
                              fontWeight: 600,
                              color: "#fff",
                              minWidth: 40,
                              textAlign: "right",
                            }}
                          >
                            {row.distinct_users.toLocaleString()}
                          </div>
                        </div>
                      </div>
                      <div
                        style={{
                          background: "#1a1a1a",
                          borderRadius: 6,
                          height: 6,
                          overflow: "hidden",
                        }}
                      >
                        <div
                          style={{
                            height: "100%",
                            width: `${barPct}%`,
                            background:
                              FUNNEL_COLORS[row.event_type] || "#3B8BD4",
                            borderRadius: 6,
                            transition: "width 0.6s ease",
                          }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div
              style={{
                background: "#111",
                border: "0.5px solid #1e1e1e",
                borderRadius: 12,
                padding: "20px 24px",
              }}
            >
              <div
                style={{
                  fontSize: 14,
                  fontWeight: 600,
                  color: "#fff",
                  marginBottom: 4,
                }}
              >
                Segments
              </div>
              <div
                style={{ fontSize: 12, color: "#5F5E5A", marginBottom: 20 }}
              >
                User intent classification
              </div>

              <div
                style={{ display: "flex", flexDirection: "column", gap: 10 }}
              >
                {data.segments.map((seg) => {
                  const cfg =
                    SEGMENT_CONFIG[seg.segment] || SEGMENT_CONFIG.UNSCORED;
                  return (
                    <div
                      key={seg.segment}
                      style={{
                        background: cfg.bg,
                        border: `0.5px solid ${cfg.color}22`,
                        borderRadius: 10,
                        padding: "12px 14px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 10,
                        }}
                      >
                        <div
                          style={{
                            width: 8,
                            height: 8,
                            borderRadius: "50%",
                            background: cfg.color,
                            flexShrink: 0,
                          }}
                        />
                        <div style={{ fontSize: 13, color: "#ccc" }}>
                          {cfg.label}
                        </div>
                      </div>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 10,
                        }}
                      >
                        <div style={{ fontSize: 12, color: "#5F5E5A" }}>
                          {seg.percentage}%
                        </div>
                        <div
                          style={{
                            fontSize: 15,
                            fontWeight: 600,
                            color: cfg.color,
                          }}
                        >
                          {seg.count.toLocaleString()}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          <div
            style={{
              background: "#111",
              border: "0.5px solid #1e1e1e",
              borderRadius: 12,
              padding: "20px 24px",
            }}
          >
            <div
              style={{ fontSize: 14, fontWeight: 600, color: "#fff", marginBottom: 4 }}
            >
              Products by capital tier
            </div>
            <div
              style={{ fontSize: 12, color: "#5F5E5A", marginBottom: 20 }}
            >
              Derived from latest questionnaire capital answer
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
                gap: 10,
              }}
            >
              {data.productsFromCapital.map((p, i) => {
                const barPct = productMax ? (p.count / productMax) * 100 : 0;
                const color = PRODUCT_COLORS[i % PRODUCT_COLORS.length];
                return (
                  <div
                    key={p.productKey}
                    style={{
                      background: "#0e0e0e",
                      border: "0.5px solid #1e1e1e",
                      borderRadius: 10,
                      padding: "14px 16px",
                    }}
                  >
                    <div
                      style={{
                        fontSize: 11,
                        color: "#5F5E5A",
                        textTransform: "uppercase",
                        letterSpacing: "0.06em",
                        marginBottom: 6,
                      }}
                    >
                      {p.capital.replace(/_/g, "–").replace("plus", "+")}
                    </div>
                    <div
                      style={{
                        fontSize: 14,
                        fontWeight: 600,
                        color: "#fff",
                        marginBottom: 10,
                        lineHeight: 1.3,
                      }}
                    >
                      {p.primaryTitle}
                    </div>
                    <div
                      style={{
                        background: "#1a1a1a",
                        borderRadius: 4,
                        height: 4,
                        marginBottom: 8,
                      }}
                    >
                      <div
                        style={{
                          height: "100%",
                          width: `${barPct}%`,
                          background: color,
                          borderRadius: 4,
                          transition: "width 0.6s ease",
                        }}
                      />
                    </div>
                    <div
                      style={{
                        fontSize: 20,
                        fontWeight: 700,
                        color,
                        letterSpacing: "-0.03em",
                      }}
                    >
                      {p.count.toLocaleString()}
                    </div>
                    <div style={{ fontSize: 11, color: "#5F5E5A", marginTop: 2 }}>
                      users at this tier
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
