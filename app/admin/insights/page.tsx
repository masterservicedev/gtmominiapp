"use client";

import { useCallback, useEffect, useState } from "react";
import { AutoRefresh } from "../_components/AutoRefresh";
import { adminApi } from "../_components/adminApi";

type Insight = {
  id: string;
  severity: "info" | "warning" | "critical";
  title: string;
  detail: string;
};

export default function AdminInsightsPage() {
  const [days, setDays] = useState(7);
  const [insights, setInsights] = useState<Insight[]>([]);
  const [cw, setCw] = useState<number | null | undefined>(undefined);
  const [err, setErr] = useState<string | null>(null);

  const load = useCallback(async () => {
    setErr(null);
    const res = await adminApi(`/api/admin/insights?days=${days}`);
    if (!res.ok) {
      setErr(res.status === 403 ? "Forbidden" : `Error ${res.status}`);
      return;
    }
    const j = await res.json();
    setInsights(j.insights ?? []);
    setCw(j.chatwootOpenUnassigned);
  }, [days]);

  useEffect(() => {
    void load();
  }, [load]);

  const sevClass = (s: Insight["severity"]) => {
    if (s === "critical") return "border-red-900/60 bg-red-950/30";
    if (s === "warning") return "border-amber-900/50 bg-amber-950/20";
    return "border-zinc-800 bg-zinc-900/30";
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-white">Insights</h1>
          <p className="text-sm text-zinc-500">
            Rules engine over shared aggregates. Tune thresholds in{" "}
            <code className="text-xs text-emerald-500/90">lib/admin-insights.ts</code>.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <label className="flex items-center gap-2 text-sm text-zinc-400">
            Window
            <select
              value={days}
              onChange={(e) => setDays(Number(e.target.value))}
              className="rounded-md border border-zinc-700 bg-zinc-900 px-2 py-1 text-white"
            >
              <option value={7}>7 days</option>
              <option value={30}>30 days</option>
              <option value={90}>90 days</option>
            </select>
          </label>
          <AutoRefresh intervalMs={90_000} onTick={load} />
        </div>
      </div>

      {cw !== undefined ? (
        <p className="text-xs text-zinc-500">
          Chatwoot open / unassigned (meta or first page):{" "}
          <span className="tabular-nums text-zinc-300">
            {cw === null ? "n/a" : cw}
          </span>
        </p>
      ) : null}

      {err ? (
        <p className="text-sm text-red-400">{err}</p>
      ) : insights.length === 0 ? (
        <p className="text-sm text-zinc-500">No insight rules fired. All quiet.</p>
      ) : (
        <ul className="space-y-3">
          {insights.map((i) => (
            <li
              key={i.id}
              className={`rounded-xl border p-4 ${sevClass(i.severity)}`}
            >
              <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
                {i.severity}
              </p>
              <p className="mt-1 font-medium text-white">{i.title}</p>
              <p className="mt-1 text-sm leading-relaxed text-zinc-400">{i.detail}</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
