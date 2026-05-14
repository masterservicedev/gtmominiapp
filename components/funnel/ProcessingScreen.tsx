"use client";

import type { FunnelAccentPalette } from "@/lib/funnel/types";
import { funnelPaletteAmber } from "@/lib/funnel/palette";

type Props = {
  message?: string;
  palette?: FunnelAccentPalette;
};

export function ProcessingScreen({
  message = "Reviewing your application…",
  palette = funnelPaletteAmber,
}: Props) {
  const dot = palette.processingDot;

  return (
    <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-gradient-to-b from-zinc-950 via-black to-zinc-950 px-8">
      <div
        className={`pointer-events-none absolute inset-0 ${palette.processingBackdrop}`}
        aria-hidden
      />
      <div className="relative flex flex-col items-center">
        <div className="mb-6 flex gap-1.5" aria-hidden>
          {[0, 1, 2].map((i) => (
            <span
              key={i}
              className={`h-2 w-2 rounded-full ${dot} animate-bounce`}
              style={{ animationDelay: `${i * 0.15}s` }}
            />
          ))}
        </div>
        <p className="text-center font-serif text-base font-normal text-zinc-100">
          {message}
        </p>
        <p className="mt-3 text-center text-xs text-zinc-500">
          This usually takes a few seconds.
        </p>
      </div>
    </div>
  );
}
