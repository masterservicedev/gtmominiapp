"use client";

import { loadWebApp } from "@/lib/twa";

const COPY = `This is not a free signals group.

This is for traders who are ready to execute, manage risk, and fund accounts with structure.

If you're here to watch from the sidelines — this isn't the right fit.`;

type Props = {
  variant: string;
  onContinue: () => void;
};

export function VideoEntry({ variant, onContinue }: Props) {
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
    <div className="min-h-screen bg-black text-white flex flex-col">
      <div className="aspect-video w-full bg-gray-900 flex items-center justify-center border-b border-gray-800">
        <div className="text-center px-6">
          <p className="text-xs uppercase tracking-widest text-emerald-400 mb-2">
            {variant}
          </p>
          <p className="text-sm text-gray-500">Video placement — embed your asset</p>
        </div>
      </div>

      <div className="flex-1 px-6 py-8 flex flex-col">
        <p className="text-sm text-gray-300 whitespace-pre-line leading-relaxed mb-8">
          {COPY}
        </p>
        <button
          type="button"
          onClick={handleContinue}
          className="mt-auto w-full py-4 rounded-xl font-semibold text-sm bg-emerald-500 text-black hover:bg-emerald-400 transition-colors"
        >
          Continue →
        </button>
      </div>
    </div>
  );
}
