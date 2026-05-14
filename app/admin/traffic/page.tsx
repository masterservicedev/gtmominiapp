"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { AutoRefresh } from "../_components/AutoRefresh";
import { adminApi } from "../_components/adminApi";

type TrafficRow = { key: string | null; users: number };

type TrafficCountryRow = {
  key: string | null;
  users: number;
  depositCvr: number;
};

type TrafficPayload = {
  days: number;
  countryLimit?: number;
  bySource: TrafficRow[];
  byCampaign: TrafficRow[];
  byVariant: TrafficRow[];
  byCountry: TrafficCountryRow[];
  generatedAt?: string;
};

const COUNTRY_ROW_LIMIT = 400;
const COUNTRY_CARD_LIMIT = 8;

const VARIANT_NAMES: Record<string, string> = {
  ad4: "Ad creative — version 4",
  ad5: "Ad creative — version 5 (code landing)",
};

const SOURCE_NAMES: Record<string, string> = {
  tg_ads: "Telegram Ads",
  referral: "Referral links",
  organic: "Organic / direct",
  push: "Push Ads",
  propeller: "Push Ads",
  voluum: "Voluum direct",
  sms: "SMS",
  email: "Email",
};

function displayLabel(
  raw: string | null,
  nameMap: Record<string, string>,
): { label: string; isNotSet: boolean } {
  const v = raw ?? "";
  if (!v || v === "(none)") return { label: "Not set", isNotSet: true };
  return { label: nameMap[v] ?? v, isNotSet: false };
}

function StatTable({
  title,
  description,
  rows,
  valueLabel,
  nameMap = {},
}: {
  title: string;
  description: string;
  rows: TrafficRow[];
  valueLabel: string;
  nameMap?: Record<string, string>;
}) {
  const max = useMemo(
    () => rows.reduce((m, r) => Math.max(m, r.users), 0),
    [rows],
  );

  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-950/50 px-5 py-5">
      <div>
        <h2 className="text-[15px] font-semibold text-white">{title}</h2>
        <p className="mt-1 text-xs leading-relaxed text-zinc-500">{description}</p>
      </div>

      <div className="mt-4 grid grid-cols-[1fr_auto] gap-x-4 gap-y-1 border-b border-zinc-800/90 pb-2 text-[11px] font-medium uppercase tracking-wide text-zinc-500">
        <span>{valueLabel}</span>
        <span className="text-right">Users</span>
      </div>

      {rows.length === 0 ? (
        <p className="py-3 text-sm text-zinc-500">No data yet for this period.</p>
      ) : (
        <ul className="mt-2 space-y-3">
          {rows.map((row, i) => {
            const { label, isNotSet } = displayLabel(row.key, nameMap);
            const barPct = max ? (row.users / max) * 100 : 0;
            return (
              <li key={`${row.key ?? "null"}-${i}`}>
                <div className="flex items-center justify-between gap-3">
                  <div
                    className={`min-w-0 text-sm ${
                      isNotSet ? "italic text-zinc-500" : "text-zinc-200"
                    }`}
                  >
                    {label}
                    {isNotSet ? (
                      <span className="ml-2 text-[11px] font-normal not-italic text-zinc-600">
                        — add UTM parameters to your ad links
                      </span>
                    ) : null}
                  </div>
                  <span className="shrink-0 text-sm font-semibold tabular-nums text-white">
                    {row.users}
                  </span>
                </div>
                <div className="mt-1.5 h-1 overflow-hidden rounded bg-zinc-800">
                  <div
                    className={`h-full rounded transition-[width] duration-500 ${
                      isNotSet ? "bg-zinc-700" : "bg-sky-600"
                    }`}
                    style={{ width: `${barPct}%` }}
                  />
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

export default function AdminTrafficPage() {
  const [days, setDays] = useState(7);
  const [tab, setTab] = useState<"overview" | "countries">("overview");
  const [data, setData] = useState<TrafficPayload | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const load = useCallback(async () => {
    setErr(null);
    const res = await adminApi(
      `/api/admin/traffic?days=${days}&countryLimit=${COUNTRY_ROW_LIMIT}`,
    );
    if (!res.ok) {
      setErr(
        res.status === 403
          ? "You do not have access to this page."
          : "Could not load traffic. Try again shortly.",
      );
      return;
    }
    setData(await res.json());
  }, [days]);

  useEffect(() => {
    void load();
  }, [load]);

  const countryTotal =
    data?.byCountry.reduce((s, r) => s + r.users, 0) ?? 0;

  const topCountries =
    data?.byCountry.slice(0, COUNTRY_CARD_LIMIT) ?? [];

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-emerald-500/90">
            Traffic
          </p>
          <h1 className="mt-1.5 text-[22px] font-semibold tracking-tight text-white">
            Where your users come from
          </h1>
          <p className="mt-1 max-w-xl text-sm text-zinc-500">
            {tab === "overview"
              ? "Ad sources, campaigns, entry experience, and a quick country snapshot — refreshed every minute"
              : "Every country in this window (up to the row limit), ordered by sign-ups — use for full lists"}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <label className="flex items-center gap-2 text-sm text-zinc-400">
            <span className="sr-only">Time window</span>
            <select
              value={days}
              onChange={(e) => setDays(Number(e.target.value))}
              className="rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 outline-none ring-emerald-500/30 focus:ring-2"
            >
              <option value={7}>Last 7 days</option>
              <option value={30}>Last 30 days</option>
              <option value={90}>Last 90 days</option>
            </select>
          </label>
          <AutoRefresh intervalMs={60_000} onTick={load} label="Refresh" />
        </div>
      </div>

      {!err && data ? (
        <div className="flex flex-wrap gap-2 border-b border-zinc-800 pb-2">
          <button
            type="button"
            onClick={() => setTab("overview")}
            className={`rounded-md px-4 py-2 text-sm font-medium transition-colors ${
              tab === "overview"
                ? "bg-zinc-800 text-white"
                : "text-zinc-400 hover:bg-zinc-900 hover:text-zinc-200"
            }`}
          >
            Overview
          </button>
          <button
            type="button"
            onClick={() => setTab("countries")}
            className={`rounded-md px-4 py-2 text-sm font-medium transition-colors ${
              tab === "countries"
                ? "bg-zinc-800 text-white"
                : "text-zinc-400 hover:bg-zinc-900 hover:text-zinc-200"
            }`}
          >
            Countries List
          </button>
        </div>
      ) : null}

      {err ? (
        <div
          className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400"
          role="alert"
        >
          {err}
        </div>
      ) : !data ? (
        <p className="text-sm text-zinc-500">Loading…</p>
      ) : tab === "overview" ? (
        <div className="grid gap-4 lg:grid-cols-2">
          <StatTable
            title="Traffic source"
            description="Which channel or partner sent each new user to the mini app"
            rows={data.bySource}
            valueLabel="Source"
            nameMap={SOURCE_NAMES}
          />
          <StatTable
            title="Campaign"
            description="Which ad campaign each new user is attributed to"
            rows={data.byCampaign}
            valueLabel="Campaign"
          />
          <StatTable
            title="Creative variant"
            description="Which version of the first-screen experience they saw"
            rows={data.byVariant}
            valueLabel="Variant"
            nameMap={VARIANT_NAMES}
          />
          <div className="rounded-xl border border-zinc-800 bg-zinc-950/50 px-5 py-5">
            <h2 className="text-[15px] font-semibold text-white">Top countries</h2>
            <p className="mt-1 text-xs leading-relaxed text-zinc-500">
              Highest-volume markets in this period (share who recorded a deposit).
              Open{" "}
              <button
                type="button"
                onClick={() => setTab("countries")}
                className="font-medium text-emerald-400/90 underline decoration-emerald-500/40 underline-offset-2 hover:text-emerald-400"
              >
                Countries List
              </button>{" "}
              for the full breakdown.
            </p>
            {topCountries.length === 0 ? (
              <p className="mt-4 text-sm text-zinc-500">No location data yet.</p>
            ) : (
              <ul className="mt-4 space-y-2.5">
                {topCountries.map((c, i) => (
                  <li
                    key={`${c.key ?? "u"}-${i}`}
                    className="flex items-center justify-between gap-3 border-b border-zinc-800/80 py-2 last:border-0 last:pb-0"
                  >
                    <span className="text-sm text-zinc-200">
                      {c.key === "(unknown)" ? "Unknown" : (c.key ?? "—")}
                    </span>
                    <div className="flex shrink-0 items-center gap-3">
                      <span className="text-sm text-zinc-500">
                        {c.users}{" "}
                        <span className="text-zinc-600">users</span>
                      </span>
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs font-semibold tabular-nums ${
                          c.depositCvr >= 25
                            ? "bg-emerald-500/15 text-emerald-400"
                            : c.depositCvr >= 10
                              ? "bg-amber-500/15 text-amber-400"
                              : "bg-zinc-800 text-zinc-500"
                        }`}
                      >
                        {c.depositCvr}% deposited
                      </span>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="rounded-xl border border-zinc-800 bg-zinc-950/50 px-5 py-5">
            <h2 className="text-[15px] font-semibold text-white">Countries List</h2>
            <p className="mt-1 max-w-3xl text-xs leading-relaxed text-zinc-500">
              All countries tracked in the selected window, grouped by country at
              first open. Up to {data.countryLimit ?? COUNTRY_ROW_LIMIT} rows,
              ordered by sign-up volume (highest first).
            </p>
            <p className="mt-3 text-sm text-zinc-400">
              <span className="text-zinc-500">Rows shown:</span>{" "}
              <span className="tabular-nums text-zinc-200">
                {data.byCountry.length}
              </span>
              <span className="mx-2 text-zinc-600">·</span>
              <span className="text-zinc-500">New users represented:</span>{" "}
              <span className="tabular-nums text-zinc-200">{countryTotal}</span>
            </p>
            {data.byCountry.length === 0 ? (
              <p className="mt-4 text-sm text-zinc-500">No location data yet.</p>
            ) : (
              <ul className="mt-4 max-h-[min(70vh,720px)] space-y-0 overflow-y-auto pr-1">
                {data.byCountry.map((c, i) => (
                  <li
                    key={`${c.key ?? "u"}-${i}`}
                    className="flex items-center justify-between gap-3 border-b border-zinc-800/80 py-2.5 last:border-0"
                  >
                    <span className="text-sm text-zinc-200">
                      {c.key === "(unknown)" ? "Unknown" : (c.key ?? "—")}
                    </span>
                    <div className="flex shrink-0 items-center gap-3">
                      <span className="text-sm text-zinc-500">
                        {c.users}{" "}
                        <span className="text-zinc-600">users</span>
                      </span>
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs font-semibold tabular-nums ${
                          c.depositCvr >= 25
                            ? "bg-emerald-500/15 text-emerald-400"
                            : c.depositCvr >= 10
                              ? "bg-amber-500/15 text-amber-400"
                              : "bg-zinc-800 text-zinc-500"
                        }`}
                      >
                        {c.depositCvr}% deposited
                      </span>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
