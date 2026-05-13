"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { DataTable } from "../_components/DataTable";
import { MetricCard } from "../_components/MetricCard";
import { AutoRefresh } from "../_components/AutoRefresh";
import { adminApi } from "../_components/adminApi";

type FeedRow = {
  id: string;
  event_type: string;
  created_at: string;
  telegram_id: string;
  username: string | null;
  first_name: string | null;
  entry_variant: string | null;
  client_ip: string | null;
};

type NurtureRow = { step: number; status: string | null; count: number };

type UserRow = {
  id: string;
  telegramId: number;
  username: string | null;
  firstName: string | null;
  entryVariant: string | null;
  segment: string | null;
  lastSeenAt: string | null;
};

export default function AdminUsersPage() {
  const [q, setQ] = useState("");
  const [searching, setSearching] = useState(false);
  const [matches, setMatches] = useState<UserRow[] | null>(null);
  const [dash, setDash] = useState<{
    feed: FeedRow[];
    nurture: NurtureRow[];
    bundle: { eligible: number; shown: number; accepted: number; used: number };
  } | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const loadDashboard = useCallback(async () => {
    setErr(null);
    setSearching(false);
    setMatches(null);
    const res = await adminApi("/api/admin/users");
    if (!res.ok) {
      setErr(res.status === 403 ? "Forbidden" : `Error ${res.status}`);
      return;
    }
    const j = await res.json();
    if (j.mode === "dashboard") {
      setDash({ feed: j.feed, nurture: j.nurture, bundle: j.bundle });
    }
  }, []);

  useEffect(() => {
    void loadDashboard();
  }, [loadDashboard]);

  async function runSearch(e: React.FormEvent) {
    e.preventDefault();
    const term = q.trim();
    if (!term) {
      void loadDashboard();
      return;
    }
    setErr(null);
    setSearching(true);
    const res = await adminApi(
      `/api/admin/users?q=${encodeURIComponent(term)}`,
    );
    if (!res.ok) {
      setErr(res.status === 403 ? "Forbidden" : `Error ${res.status}`);
      setSearching(false);
      return;
    }
    const j = await res.json();
    setMatches(j.matches ?? []);
    setDash(null);
    setSearching(false);
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-white">Users</h1>
          <p className="text-sm text-zinc-500">
            Live event feed, nurture queue rollup, bundle stats. Search by Telegram
            id or name (opens matches below).
          </p>
        </div>
        <AutoRefresh intervalMs={45_000} onTick={loadDashboard} />
      </div>

      <form onSubmit={runSearch} className="flex flex-wrap gap-2">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Telegram id or username…"
          className="min-w-[200px] flex-1 rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-white placeholder:text-zinc-600"
        />
        <button
          type="submit"
          className="rounded-md bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-500"
        >
          Search
        </button>
        <button
          type="button"
          onClick={() => {
            setQ("");
            void loadDashboard();
          }}
          className="rounded-md border border-zinc-700 px-4 py-2 text-sm text-zinc-300 hover:bg-zinc-900"
        >
          Clear
        </button>
      </form>

      {err ? <p className="text-sm text-red-400">{err}</p> : null}

      {matches ? (
        <section>
          <h2 className="mb-3 text-lg font-medium text-white">Matches</h2>
          {matches.length === 0 ? (
            <p className="text-sm text-zinc-500">No users found.</p>
          ) : (
            <ul className="space-y-2">
              {matches.map((u) => (
                <li key={u.id}>
                  <Link
                    href={`/admin/user/${u.telegramId}`}
                    className="block rounded-lg border border-zinc-800 bg-zinc-900/40 px-3 py-2 text-sm hover:border-emerald-700/50"
                  >
                    <span className="font-mono text-emerald-400/90">
                      {u.telegramId}
                    </span>
                    {u.username ? (
                      <span className="ml-2 text-zinc-300">@{u.username}</span>
                    ) : null}
                    {u.firstName ? (
                      <span className="ml-2 text-zinc-400">{u.firstName}</span>
                    ) : null}
                    <span className="ml-2 text-xs text-zinc-500">
                      {u.segment} · {u.entryVariant}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
      ) : searching ? (
        <p className="text-sm text-zinc-500">Searching…</p>
      ) : dash ? (
        <>
          <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <MetricCard title="Bundle eligible" value={dash.bundle.eligible} />
            <MetricCard title="Bundle offer shown" value={dash.bundle.shown} />
            <MetricCard title="Bundle accepted" value={dash.bundle.accepted} />
            <MetricCard title="Bundle used (deposit)" value={dash.bundle.used} />
          </section>

          <section>
            <h2 className="mb-3 text-lg font-medium text-white">Nurture queue</h2>
            <DataTable
              columns={[
                { key: "step", label: "Step" },
                { key: "status", label: "Status" },
                { key: "count", label: "Count" },
              ]}
              rows={dash.nurture.map((n) => ({
                step: n.step,
                status: n.status,
                count: n.count,
              }))}
            />
          </section>

          <section>
            <h2 className="mb-3 text-lg font-medium text-white">Recent events</h2>
            <DataTable
              columns={[
                { key: "time", label: "Time" },
                { key: "event_type", label: "Event" },
                { key: "client_ip", label: "IP" },
                { key: "telegram_id", label: "TG" },
                { key: "who", label: "User" },
                { key: "entry_variant", label: "Variant" },
              ]}
              rows={dash.feed.map((r) => ({
                time: new Date(r.created_at).toLocaleString(),
                event_type: r.event_type,
                client_ip: r.client_ip ?? "—",
                telegram_id: r.telegram_id,
                who: r.username || r.first_name || "—",
                entry_variant: r.entry_variant ?? "—",
              }))}
            />
          </section>
        </>
      ) : (
        <p className="text-sm text-zinc-500">Loading…</p>
      )}
    </div>
  );
}
