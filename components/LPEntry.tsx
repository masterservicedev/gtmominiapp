"use client";

import { loadWebApp } from "@/lib/twa";

const COPY = `This is not a free signals group.

This is for traders who are ready to execute, manage risk, and fund accounts with structure.

If you're here to watch from the sidelines — this isn't the right fit.`;

type Props = {
  variant: string;
  onContinue: () => void;
};

export function LPEntry({ variant, onContinue }: Props) {
  async function handleContinue() {
    const WebApp = await loadWebApp();
    fetch("/api/event", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        initData: WebApp.initData,
        eventType: "offer_complete",
        metadata: { variant },
      }),
    }).finally(() => onContinue());
  }

  return (
    <div className="min-h-screen bg-black text-white flex flex-col px-6 py-10">
      <p className="text-xs uppercase tracking-widest text-emerald-400 mb-6">
        {variant}
      </p>
      <p className="text-sm text-gray-300 whitespace-pre-line leading-relaxed flex-1">
        {COPY}
      </p>
      <button
        type="button"
        onClick={handleContinue}
        className="mt-10 w-full py-4 rounded-xl font-semibold text-sm bg-emerald-500 text-black hover:bg-emerald-400 transition-colors"
      >
        Continue →
      </button>
    </div>
  );
}
