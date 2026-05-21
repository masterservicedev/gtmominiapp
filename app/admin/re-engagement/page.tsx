"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { AutoRefresh } from "../_components/AutoRefresh";
import { adminApi } from "../_components/adminApi";

type Row = {
  queueId: string;
  userId: string;
  telegramId: number;
  username: string | null;
  firstName: string | null;
  segment: string | null;
  crmTriggered: boolean | null;
  scheduledAt: string;
  broadcastType: string | null;
  nurtureKind: string | null;
  step: number;
  campaignLabel: string;
  messageVariant: string;
  messageMarkdown: string;
  messagePlain: string;
  adminHint: string;
};

type SendStat = {
  broadcastType: string;
  label: string;
  sentCount: number;
};

type Payload = {
  days: number;
  generatedAt: string;
  total: number;
  totalSends: number;
  countsByBroadcastType: Record<string, number>;
  sendsByType: SendStat[];
  items: Row[];
};

const SEGMENT_RING: Record<string, string> = {
  HIGH: "text-rose-400 ring-rose-500/30 bg-rose-500/10",
  MID: "text-amber-400 ring-amber-500/30 bg-amber-500/10",
  LOW: "text-zinc-400 ring-zinc-600/40 bg-zinc-800/80",
};

function formatRelativeSchedule(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const diffMs = d.getTime() - now.getTime();
  const diffH = Math.round(diffMs / 3_600_000);
  if (diffMs <= 0) return "Due now";
  if (diffH < 1) return "Due soon";
  if (diffH < 24) return `In ${diffH}h`;
  const diffD = Math.round(diffH / 24);
  return `In ${diffD} day${diffD !== 1 ? "s" : ""}`;
}

function truncateOneLine(text: string, max = 100): string {
  const t = text.replace(/\s+/g, " ").trim();
  if (t.length <= max) return t || "—";
  return `${t.slice(0, max).trim()}…`;
}

export default function AdminReEngagementPage() {
  const [days, setDays] = useState(14);
  const [data, setData] = useState<Payload | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setErr(null);
    const res = await adminApi(
      `/api/admin/re-engagement?days=${encodeURIComponent(String(days))}`,
    );
    if (!res.ok) {
      setErr(
        res.status === 403
          ? "You do not have access to this page."
          : "Could not load the queue. Try again shortly.",
      );
      setData(null);
      return;
    }
    const j = await res.json();
    setData({
      ...j,
      sendsByType: j.sendsByType ?? [],
      totalSends: j.totalSends ?? 0,
    });
  }, [days]);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-emerald-500/90">
            Re-engagement
          </p>
          <h1 className="mt-1.5 text-[22px] font-semibold tracking-tight text-white">
            Nurture queue &amp; sends
          </h1>
          <p className="mt-1 max-w-xl text-sm text-zinc-500">
            Scheduled follow-ups (Railway worker) and sends logged in the last{" "}
            {days} days
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <label className="flex items-center gap-2 text-sm text-zinc-400">
            <span className="whitespace-nowrap">Show next</span>
            <select
              value={days}
              onChange={(e) => setDays(Number(e.target.value))}
              className="rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 outline-none ring-emerald-500/30 focus:ring-2"
            >
              {[7, 14, 30, 60, 90].map((d) => (
                <option key={d} value={d}>
                  {d} days
                </option>
              ))}
            </select>
          </label>
          <AutoRefresh intervalMs={60_000} onTick={load} label="Refresh" />
        </div>
      </div>

      {err ? (
        <div
          className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400"
          role="alert"
        >
          {err}
        </div>
      ) : !data ? (
        <p className="text-sm text-zinc-500">Loading…</p>
      ) : (
        <>
          <section className="rounded-xl border border-zinc-800 bg-zinc-950/50 px-5 py-5">
            <h2 className="text-[15px] font-semibold text-white">
              Broadcasts sent (last {days} days)
            </h2>
            <p className="mt-1 text-xs text-zinc-500">
              Counts from <code className="text-emerald-500/90">broadcast_sent</code>{" "}
              events after the Railway worker delivers each message.
            </p>
            <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {data.sendsByType.map((s) => (
                <div
                  key={s.broadcastType}
                  className="rounded-lg border border-zinc-800 bg-zinc-950/80 px-4 py-3"
                >
                  <p className="text-xs font-medium text-zinc-400">{s.label}</p>
                  <p className="mt-1 text-2xl font-bold tabular-nums text-white">
                    {s.sentCount}
                  </p>
                  <p className="text-[11px] text-zinc-600">sent</p>
                </div>
              ))}
            </div>
            <p className="mt-3 text-sm text-zinc-500">
              Total sends:{" "}
              <span className="font-semibold tabular-nums text-zinc-200">
                {data.totalSends}
              </span>
            </p>
          </section>

          {data.items.length === 0 ? (
        <div className="rounded-xl border border-zinc-800 bg-zinc-950/40 px-8 py-14 text-center">
          <div
            className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-zinc-700 bg-zinc-900/80 text-2xl text-zinc-500"
            aria-hidden
          >
            ✉
          </div>
          <h2 className="text-base font-semibold text-white">
            No messages scheduled in this window
          </h2>
          <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-zinc-500">
            When people finish the questionnaire and qualify, their follow-up
            messages appear here with the send time and a preview of what they
            will receive.
          </p>
        </div>
          ) : (
        <>
          <div className="flex flex-wrap items-center gap-6 rounded-xl border border-zinc-800 bg-zinc-950/50 px-5 py-4">
            <div>
              <p className="text-2xl font-bold tabular-nums tracking-tight text-white">
                {data.total}
              </p>
              <p className="text-xs text-zinc-500">messages scheduled</p>
            </div>
            <div className="hidden h-10 w-px bg-zinc-800 sm:block" aria-hidden />
            <p className="text-sm text-zinc-500">
              In the next <span className="text-zinc-300">{days} days</span>
            </p>
          </div>

          <ul className="space-y-2">
            {data.items.map((r) => {
              const open = expandedId === r.queueId;
              const name =
                r.firstName?.trim() ||
                r.username?.trim() ||
                `User ${r.telegramId}`;
              const seg = r.segment ?? "—";
              const segCls = SEGMENT_RING[seg] ?? SEGMENT_RING.LOW;
              const rel = formatRelativeSchedule(r.scheduledAt);
              const dueSoon = rel === "Due now" || rel === "Due soon";
              const preview = truncateOneLine(r.messagePlain || "—");

              return (
                <li
                  key={r.queueId}
                  className={`overflow-hidden rounded-xl border transition-colors ${
                    open ? "border-zinc-600 bg-zinc-900/40" : "border-zinc-800 bg-zinc-950/40"
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => setExpandedId(open ? null : r.queueId)}
                    className="flex w-full items-center gap-3 px-4 py-3.5 text-left sm:gap-4"
                  >
                    <div
                      className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-[10px] font-bold ring-1 ${segCls}`}
                      aria-hidden
                      title={r.broadcastType ?? undefined}
                    >
                      {seg.slice(0, 1)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <Link
                          href={`/admin/user/${r.userId}`}
                          onClick={(e) => e.stopPropagation()}
                          className="truncate text-sm font-semibold text-emerald-400 hover:underline"
                        >
                          {name}
                        </Link>
                        <span
                          className={`rounded-full px-2 py-0.5 text-[11px] font-medium ring-1 ${segCls}`}
                        >
                          {seg}
                        </span>
                        {r.crmTriggered ? (
                          <span className="text-[11px] text-zinc-600">Sales contacted</span>
                        ) : null}
                      </div>
                      <p className="mt-0.5 truncate text-xs text-zinc-500">
                        {r.campaignLabel} · {preview}
                      </p>
                    </div>
                    <div className="shrink-0 text-right">
                      <p
                        className={`text-sm font-semibold ${
                          dueSoon ? "text-rose-400" : "text-zinc-200"
                        }`}
                      >
                        {rel}
                      </p>
                      <p className="text-[11px] text-zinc-600">
                        {new Date(r.scheduledAt).toLocaleDateString(undefined, {
                          day: "numeric",
                          month: "short",
                        })}
                      </p>
                    </div>
                    <span
                      className={`hidden shrink-0 text-zinc-500 transition-transform sm:inline ${open ? "rotate-180" : ""}`}
                      aria-hidden
                    >
                      ▼
                    </span>
                  </button>

                  {open ? (
                    <div className="border-t border-zinc-800 px-4 pb-4 pt-3">
                      <p className="text-[11px] font-medium uppercase tracking-wide text-zinc-500">
                        Full message (as sent in Telegram)
                      </p>
                      <div className="mt-2 max-h-72 overflow-y-auto rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-3 text-sm leading-relaxed text-zinc-200">
                        <pre className="whitespace-pre-wrap font-sans">{r.messagePlain || "—"}</pre>
                      </div>
                      {r.adminHint ? (
                        <div className="mt-3">
                          <p className="text-[11px] font-medium uppercase tracking-wide text-zinc-500">
                            Why they see this
                          </p>
                          <p className="mt-1 text-xs leading-relaxed text-zinc-500">
                            {r.adminHint}
                          </p>
                        </div>
                      ) : null}
                    </div>
                  ) : null}
                </li>
              );
            })}
          </ul>

          <p className="text-right text-[11px] text-zinc-600">
            Up to 500 rows · Updated{" "}
            {new Date(data.generatedAt).toLocaleTimeString(undefined, {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </p>
        </>
          )}
        </>
      )}
    </div>
  );
}
