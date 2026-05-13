"use client";

import { useCallback, useEffect, useState } from "react";
import { loadWebApp } from "@/lib/twa";

type ReactivateState = {
  state: "valid" | "no_offer" | "deposited";
  message?: string;
  user?: {
    firstName: string | null;
    segment: string;
    bundleEligible: boolean | null;
    bundleUsed: boolean | null;
    bundleAccepted: boolean | null;
    confirmedProductKey: string | null;
  };
  offer?: {
    id: string;
    offerType: string;
    expiresAt: string;
  } | null;
  productMatch?: {
    productKey: string;
    displayName: string;
    depositRequiredUsd: number;
    bundleOfferLine: string | null;
  };
  needCapitalQuestion?: boolean;
  capital?: string | null;
};

export default function ReactivatePage() {
  const [err, setErr] = useState<string | null>(null);
  const [initData, setInitData] = useState<string | null>(null);
  const [data, setData] = useState<ReactivateState | null>(null);
  const [busy, setBusy] = useState(false);
  /** After user answers the LOW capital prompt, show offer even if capital stayed `under_100`. */
  const [capitalDismissed, setCapitalDismissed] = useState(false);

  const load = useCallback(async (id: string) => {
    setErr(null);
    const res = await fetch("/api/reactivate/state", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ initData: id }),
    });
    if (!res.ok) {
      setErr(res.status === 401 ? "Session invalid — reopen from Telegram." : "Could not load.");
      return;
    }
    setData(await res.json());
  }, []);

  useEffect(() => {
    void loadWebApp().then((WebApp) => {
      WebApp.ready();
      const id = WebApp.initData;
      if (!id) {
        setErr("Open this page from the Telegram mini app.");
        return;
      }
      setInitData(id);
      void load(id);
    });
  }, [load]);

  const submitCapital = async (capital: string) => {
    if (!initData) return;
    setBusy(true);
    try {
      const res = await fetch("/api/reactivate/capital", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ initData, capital }),
      });
      if (!res.ok) {
        setErr("Could not update capital.");
        return;
      }
      setCapitalDismissed(true);
      await load(initData);
    } finally {
      setBusy(false);
    }
  };

  const confirm = async () => {
    if (!initData) return;
    setBusy(true);
    setErr(null);
    try {
      const res = await fetch("/api/reactivate/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          initData,
          offerId: data?.offer?.id ?? undefined,
        }),
      });
      if (!res.ok) {
        const j = (await res.json().catch(() => ({}))) as { message?: string };
        setErr(j.message ?? "Could not confirm.");
        return;
      }
      setData((prev) =>
        prev
          ? {
              ...prev,
              message: "Done — check this chat for your specialist.",
            }
          : prev,
      );
    } finally {
      setBusy(false);
    }
  };

  if (err && !data) {
    return (
      <div className="min-h-screen bg-zinc-950 text-zinc-100 flex items-center justify-center p-6">
        <p className="text-sm text-zinc-400 text-center max-w-sm">{err}</p>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen bg-zinc-950 text-zinc-100 flex items-center justify-center p-6">
        <p className="text-sm text-zinc-500">Loading…</p>
      </div>
    );
  }

  if (data.state === "deposited") {
    return (
      <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col items-center justify-center p-6">
        <p className="text-center text-sm text-zinc-300 max-w-md">
          {data.message ?? "You're already active with us."}
        </p>
      </div>
    );
  }

  const name = data.user?.firstName || "there";
  const showBundle =
    data.user?.bundleEligible &&
    !data.user?.bundleUsed &&
    data.productMatch?.bundleOfferLine;

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 px-4 py-10 pb-16">
      <div className="mx-auto max-w-md space-y-6">
        <header>
          <h1 className="font-serif text-2xl font-normal tracking-tight text-zinc-50">
            Welcome back, {name}
          </h1>
          <p className="mt-2 text-sm text-zinc-400 leading-relaxed">
            Your access is still available at the level you qualified for.
          </p>
        </header>

        {data.needCapitalQuestion && !capitalDismissed ? (
          <section className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-4 space-y-3">
            <p className="text-sm text-zinc-300">
              Have your available funds changed since you first applied?
            </p>
            <div className="flex flex-col gap-2">
              <button
                type="button"
                disabled={busy}
                onClick={() => submitCapital("100_300")}
                className="rounded-lg bg-emerald-600/90 px-4 py-3 text-sm font-medium text-white disabled:opacity-50"
              >
                Yes — I have more available now
              </button>
              <button
                type="button"
                disabled={busy}
                onClick={() => submitCapital("under_100")}
                className="rounded-lg border border-zinc-700 px-4 py-3 text-sm text-zinc-200 disabled:opacity-50"
              >
                About the same
              </button>
            </div>
          </section>
        ) : null}

        {!data.needCapitalQuestion || capitalDismissed ? (
          <>
            <section className="rounded-xl border border-zinc-800 bg-zinc-900/30 p-4">
              <p className="text-xs uppercase tracking-wide text-zinc-500 mb-1">
                Your offer
              </p>
              <p className="text-lg font-medium text-zinc-100">
                {data.productMatch?.displayName ?? "—"}
              </p>
              <p className="mt-2 text-sm text-zinc-400">
                From ${data.productMatch?.depositRequiredUsd ?? "—"} funding when
                you proceed with your specialist.
              </p>
              {showBundle ? (
                <p className="mt-3 text-sm text-amber-200/90">
                  Bundle: {data.productMatch?.bundleOfferLine}
                </p>
              ) : null}
            </section>

            {data.offer ? (
              <p className="text-xs text-zinc-500">
                This session link is held until{" "}
                {new Date(data.offer.expiresAt).toLocaleString()}.
              </p>
            ) : null}

            {data.message ? (
              <p className="text-sm text-emerald-400/95">{data.message}</p>
            ) : null}

            {err ? <p className="text-sm text-red-400">{err}</p> : null}

            <button
              type="button"
              disabled={busy || Boolean(data.message)}
              onClick={() => void confirm()}
              className="w-full rounded-xl bg-emerald-600 px-4 py-3.5 text-sm font-semibold text-white shadow-lg shadow-emerald-900/20 disabled:opacity-40"
            >
              READY — connect me with a specialist
            </button>
          </>
        ) : null}
      </div>
    </div>
  );
}
