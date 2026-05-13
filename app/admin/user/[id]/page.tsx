"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { adminApi } from "../../_components/adminApi";

type TimelineRow = {
  id: string;
  eventType: string;
  createdAt: string;
  metadata: unknown;
};

function ipFromEventMetadata(m: unknown): string {
  if (
    m &&
    typeof m === "object" &&
    "ip" in m &&
    typeof (m as { ip?: unknown }).ip === "string"
  ) {
    return (m as { ip: string }).ip;
  }
  return "—";
}

export default function AdminUserDetailPage() {
  const params = useParams();
  const id = String(params.id ?? "");
  const [data, setData] = useState<{
    user: Record<string, unknown>;
    questionnaire: Record<string, unknown> | null;
    timeline: TimelineRow[];
    broadcastOffers: {
      id: string;
      offerType: string;
      expiresAt: string;
      claimed: boolean | null;
      createdAt: string | null;
    }[];
    chatwoot: {
      status: string | null;
      assigneeId: number | null;
      teamId: number | null;
      inboxId: number | null;
    } | null;
  } | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!id) return;
    setErr(null);
    const res = await adminApi(`/api/admin/user/${encodeURIComponent(id)}`);
    if (res.status === 404) {
      setErr("User not found");
      setData(null);
      return;
    }
    if (!res.ok) {
      setErr(res.status === 403 ? "Forbidden" : `Error ${res.status}`);
      return;
    }
    setData(await res.json());
  }, [id]);

  useEffect(() => {
    void load();
  }, [load]);

  const u = data?.user;

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center gap-3 text-sm">
        <Link href="/admin/users" className="text-emerald-400 hover:underline">
          ← Users
        </Link>
      </div>

      {err ? (
        <p className="text-sm text-red-400">{err}</p>
      ) : !u ? (
        <p className="text-sm text-zinc-500">Loading…</p>
      ) : (
        <>
          <section className="rounded-xl border border-zinc-800 bg-zinc-900/30 p-4">
            <h1 className="text-lg font-semibold text-white">
              {String(u.firstName ?? "")}{" "}
              <span className="font-mono text-sm text-emerald-400/90">
                tg:{String(u.telegramId)}
              </span>
            </h1>
            <dl className="mt-3 grid gap-2 text-sm sm:grid-cols-2">
              <div>
                <dt className="text-zinc-500">Internal id</dt>
                <dd className="font-mono text-xs text-zinc-300">{String(u.id)}</dd>
              </div>
              <div>
                <dt className="text-zinc-500">Segment</dt>
                <dd className="text-zinc-200">{String(u.segment)}</dd>
              </div>
              <div>
                <dt className="text-zinc-500">Variant</dt>
                <dd className="text-zinc-200">{String(u.entryVariant ?? "—")}</dd>
              </div>
              <div>
                <dt className="text-zinc-500">Country</dt>
                <dd className="text-zinc-200">
                  {String(u.country ?? "—")}
                  {u.countryCode ? ` (${String(u.countryCode)})` : ""}
                </dd>
              </div>
              <div>
                <dt className="text-zinc-500">Signup IP</dt>
                <dd className="font-mono text-xs text-zinc-300">
                  {String(u.signupIp ?? "—")}
                </dd>
              </div>
              <div>
                <dt className="text-zinc-500">Last seen IP</dt>
                <dd className="font-mono text-xs text-zinc-300">
                  {String(u.lastSeenIp ?? "—")}
                </dd>
              </div>
              <div>
                <dt className="text-zinc-500">UTM</dt>
                <dd className="text-zinc-200">
                  {String(u.utmSource ?? "—")} / {String(u.utmCampaign ?? "—")}
                </dd>
              </div>
              <div>
                <dt className="text-zinc-500">Chatwoot conversation</dt>
                <dd className="font-mono text-xs text-zinc-300">
                  {String(u.chatwootConversationId ?? "—")}
                </dd>
              </div>
            </dl>
          </section>

          <section className="rounded-xl border border-zinc-800 bg-zinc-900/20 p-4">
            <h2 className="text-base font-medium text-white">Chatwoot</h2>
            {!data.chatwoot ? (
              <p className="mt-2 text-sm text-zinc-500">
                {u.chatwootConversationId
                  ? "Status unavailable (API error or not configured)."
                  : "No conversation id on user row."}
              </p>
            ) : (
              <dl className="mt-2 grid gap-2 text-sm sm:grid-cols-2">
                <div>
                  <dt className="text-zinc-500">Status</dt>
                  <dd className="text-zinc-200">{data.chatwoot.status ?? "—"}</dd>
                </div>
                <div>
                  <dt className="text-zinc-500">Assignee id</dt>
                  <dd className="text-zinc-200">
                    {data.chatwoot.assigneeId ?? "—"}
                  </dd>
                </div>
                <div>
                  <dt className="text-zinc-500">Team id</dt>
                  <dd className="text-zinc-200">{data.chatwoot.teamId ?? "—"}</dd>
                </div>
                <div>
                  <dt className="text-zinc-500">Inbox id</dt>
                  <dd className="text-zinc-200">{data.chatwoot.inboxId ?? "—"}</dd>
                </div>
              </dl>
            )}
          </section>

          {data.broadcastOffers?.length ? (
            <section className="rounded-xl border border-zinc-800 bg-zinc-900/20 p-4">
              <h2 className="text-base font-medium text-white">
                Broadcast offers
              </h2>
              <ul className="mt-3 space-y-2 text-sm text-zinc-300">
                {data.broadcastOffers.map((o) => (
                  <li
                    key={o.id}
                    className="flex flex-wrap justify-between gap-2 border-b border-zinc-800/80 pb-2 last:border-0"
                  >
                    <span className="font-mono text-xs text-zinc-400">
                      {o.offerType}
                    </span>
                    <span className="text-zinc-500 text-xs">
                      {o.claimed ? "claimed" : "open"} · exp{" "}
                      {new Date(o.expiresAt).toLocaleString()}
                    </span>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}

          {data.questionnaire ? (
            <section>
              <h2 className="mb-2 text-base font-medium text-white">
                Latest questionnaire
              </h2>
              <pre className="max-h-64 overflow-auto rounded-lg border border-zinc-800 bg-black/40 p-3 text-xs text-zinc-300">
                {JSON.stringify(data.questionnaire, null, 2)}
              </pre>
            </section>
          ) : (
            <p className="text-sm text-zinc-500">No questionnaire answers yet.</p>
          )}

          <section>
            <h2 className="mb-3 text-base font-medium text-white">Event timeline</h2>
            <div className="overflow-x-auto rounded-lg border border-zinc-800">
              <table className="min-w-full text-left text-sm">
                <thead className="bg-zinc-900/80 text-xs uppercase text-zinc-500">
                  <tr>
                    <th className="px-3 py-2">Time</th>
                    <th className="px-3 py-2">Event</th>
                    <th className="px-3 py-2">IP</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800">
                  {data.timeline.map((t) => (
                    <tr key={t.id} className="bg-zinc-950/40">
                      <td className="whitespace-nowrap px-3 py-2 text-zinc-400">
                        {new Date(t.createdAt).toLocaleString()}
                      </td>
                      <td className="px-3 py-2 text-zinc-200">{t.eventType}</td>
                      <td className="whitespace-nowrap px-3 py-2 font-mono text-xs text-zinc-400">
                        {ipFromEventMetadata(t.metadata)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </>
      )}
    </div>
  );
}
