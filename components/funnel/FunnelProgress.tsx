"use client";

import type { FunnelAccentPalette } from "@/lib/funnel/types";
import { funnelPaletteAmber } from "@/lib/funnel/palette";

type Props = {
  current: number;
  total: number;
  label?: string;
  palette?: FunnelAccentPalette;
  /** Light pages (e.g. code offer): neutral track so the accent is the visible strip. */
  surface?: "onDark" | "onLight";
};

export function FunnelProgress({
  current,
  total,
  label,
  palette = funnelPaletteAmber,
  surface = "onDark",
}: Props) {
  const t = palette;
  const pct = total > 0 ? Math.min(100, (current / total) * 100) : 0;
  const trackClass =
    surface === "onLight" ? "bg-zinc-200/95" : "bg-zinc-800";

  return (
    <div className="w-full">
      <div className={`w-full h-1 rounded-full overflow-hidden ${trackClass}`}>
        <div
          className={`h-full ${t.accentBg} transition-all duration-500 rounded-full`}
          style={{ width: `${pct}%` }}
        />
      </div>
      {label && (
        <p
          className={`px-6 pt-2 text-xs ${
            surface === "onLight" ? "text-zinc-600" : "text-zinc-500"
          }`}
        >
          {label}
        </p>
      )}
    </div>
  );
}
