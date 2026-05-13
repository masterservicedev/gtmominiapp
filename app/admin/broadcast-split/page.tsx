"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { AutoRefresh } from "../_components/AutoRefresh";
import { adminApi } from "../_components/adminApi";

const MIN_SENDS_PER_VERSION = 20;
const WIN_MARGIN_POINTS = 3;

type Stat = {
  broadcastType: string;
  variant: string;
  sentCount: number;
  replyCount: number;
  replyRatePct: number | null;
};

type Winner = {
  broadcastType: string;
  label: string;
  badge: "green" | "amber" | "grey";
  leadingVariant: string | null;
  note: string;
};

type Payload = {
  generatedAt: string;
  stats: Stat[];
  winners: Record<string, Winner>;
  variantStrategy: Record<string, string>;
  broadcastLabels: Record<string, string>;
};

function groupStats(stats: Stat[]): Map<string, Stat[]> {
  const m = new Map<string, Stat[]>();
  for (const s of stats) {
    const list = m.get(s.broadcastType) ?? [];
    list.push(s);
    m.set(s.broadcastType, list);
  }
  return m;
}

function winnerSummary(w: Winner | undefined): string | null {
  if (!w) return null;
  if (w.badge === "green" && w.leadingVariant) {
    return `Version ${w.leadingVariant} is ahead right now — you could make it the default once you are comfortable with the sample size.`;
  }
  if (w.badge === "amber") {
    return "The top two versions are still close — keep the test running before changing defaults.";
  }
  if (w.badge === "grey") {
    return "Not enough activity yet to pick a favourite version for this message.";
  }
  return null;
}

function VariantCard({
  variant,
  row,
  isBest,
}: {
  variant: string;
  row: Stat | undefined;
  isBest: boolean;
}) {
  const sent = row?.sentCount ?? 0;
  const replies = row?.replyCount ?? 0;
  const rate = row?.replyRatePct ?? 0;
  const needMore =
    sent > 0 && sent < MIN_SENDS_PER_VERSION
      ? MIN_SENDS_PER_VERSION - sent
      : null;

  return (
    <div
      className={`flex min-w-0 flex-1 flex-col rounded-lg border px-4 py-3.5 ${
        isBest
          ? "border-emerald-500/25 bg-emerald-500/[0.06]"
          : "border-zinc-800 bg-zinc-950/80"
      }`}
    >
      <div className="flex items-center justify-between gap-2">
        <span
          className={`flex h-7 w-7 items-center justify-center rounded-md text-xs font-bold ${
            isBest
              ? "bg-emerald-500/15 text-emerald-400"
              : "bg-zinc-800 text-zinc-400"
          }`}
        >
          {variant}
        </span>
        {isBest ? (
          <span className="rounded-full bg-emerald-500/15 px-2 py-0.5 text-[11px] font-semibold text-emerald-400">
            Best
          </span>
        ) : null}
      </div>

      {sent === 0 ? (
        <p className="mt-3 text-xs text-zinc-600">No sends yet for this version</p>
      ) : (
        <>
          <p
            className={`mt-3 text-2xl font-bold tabular-nums tracking-tight ${
              isBest ? "text-emerald-400" : "text-white"
            }`}
          >
            {rate}%
          </p>
          <p className="text-[11px] text-zinc-500">Reply rate</p>
          <div className="mt-3 flex justify-between gap-3 border-t border-zinc-800/90 pt-3 text-center">
            <div>
              <p className="text-sm font-semibold tabular-nums text-zinc-200">{sent}</p>
              <p className="text-[11px] text-zinc-500">Sent</p>
            </div>
            <div>
              <p className="text-sm font-semibold tabular-nums text-zinc-200">{replies}</p>
              <p className="text-[11px] text-zinc-500">Replied</p>
            </div>
          </div>
          {needMore != null ? (
            <p className="mt-2 text-[11px] text-zinc-600">
            Need about {needMore} more sends on this version before it can win the test
            </p>
          ) : null}
        </>
      )}
    </div>
  );
}

export default function BroadcastSplitPage() {
  const [data, setData] = useState<Payload | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const load = useCallback(async () => {
    setErr(null);
    const res = await adminApi("/api/admin/broadcast-split");
    if (!res.ok) {
      setErr(
        res.status === 403
          ? "You do not have access to this page."
          : "Could not load message test results. Try again shortly.",
      );
      setData(null);
      return;
    }
    setData(await res.json());
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const types = useMemo(() => {
    if (!data?.stats.length) return [];
    return Array.from(new Set(data.stats.map((s) => s.broadcastType))).sort();
  }, [data]);

  const hasAnySends = useMemo(
    () => Boolean(data?.stats.some((s) => s.sentCount > 0)),
    [data],
  );

  const byType = data ? groupStats(data.stats) : null;

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-emerald-500/90">
            Message testing
          </p>
          <h1 className="mt-1.5 text-[22px] font-semibold tracking-tight text-white">
            Which message version works best?
          </h1>
          <p className="mt-1 max-w-2xl text-sm text-zinc-500">
            Three versions of each follow-up rotate automatically. Higher reply rate means
            more people came back after that message.
          </p>
        </div>
        <AutoRefresh intervalMs={60_000} onTick={load} label="Refresh" />
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
            <h2 className="text-[15px] font-semibold text-white">What A, B, and C mean</h2>
            <p className="mt-1 text-xs text-zinc-500">
              Each label is a different tone and structure; the bot picks one at random unless
              your team forces a single version in configuration.
            </p>
            <dl className="mt-4 grid gap-4 sm:grid-cols-3">
              {(["A", "B", "C"] as const).map((v) => (
                <div key={v}>
                  <dt className="text-sm font-semibold text-emerald-400/90">Version {v}</dt>
                  <dd className="mt-1 text-xs leading-relaxed text-zinc-500">
                    {data.variantStrategy[v] ?? "—"}
                  </dd>
                </div>
              ))}
            </dl>
          </section>

          {!hasAnySends ? (
            <div className="rounded-xl border border-zinc-800 bg-zinc-950/40 px-8 py-14 text-center">
              <div
                className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-zinc-700 bg-zinc-900/80 text-2xl text-zinc-500"
                aria-hidden
              >
                ◎
              </div>
              <h2 className="text-base font-semibold text-white">No follow-up sends yet</h2>
              <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-zinc-500">
                Once the bot starts sending scheduled follow-ups, results show up here on their
                own. We suggest at least {MIN_SENDS_PER_VERSION} sends per version before treating
                any version as the clear winner.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {types.map((bt) => {
                const rows = byType?.get(bt) ?? [];
                const w = data.winners[bt];
                const summary = winnerSummary(w);
                return (
                  <article
                    key={bt}
                    className="rounded-xl border border-zinc-800 bg-zinc-950/40 px-5 py-5"
                  >
                    <header className="mb-4">
                      <h2 className="text-[15px] font-semibold text-white">
                        {data.broadcastLabels[bt] ?? "Follow-up message"}
                      </h2>
                      {summary ? (
                        <p className="mt-1.5 text-sm leading-relaxed text-zinc-500">
                          {summary}
                        </p>
                      ) : null}
                    </header>
                    <div className="flex flex-col gap-3 sm:flex-row">
                      {(["A", "B", "C"] as const).map((v) => {
                        const row = rows.find((x) => x.variant === v);
                        const isBest =
                          w?.badge === "green" && w.leadingVariant === v;
                        return (
                          <VariantCard
                            key={v}
                            variant={v}
                            row={row}
                            isBest={isBest}
                          />
                        );
                      })}
                    </div>
                  </article>
                );
              })}
            </div>
          )}

          <p className="text-right text-[11px] leading-relaxed text-zinc-600">
            Best appears when one version leads by more than {WIN_MARGIN_POINTS} points on
            replies and has at least {MIN_SENDS_PER_VERSION} sends · Updated{" "}
            {new Date(data.generatedAt).toLocaleTimeString(undefined, {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </p>
        </>
      )}
    </div>
  );
}
