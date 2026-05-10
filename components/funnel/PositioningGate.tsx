"use client";

import type { ReactNode } from "react";
import type { FunnelTheme } from "@/lib/funnel/types";
import { getThemeClasses } from "@/lib/funnel/theme";
import { SocialProofTicker } from "./SocialProofTicker";

type Props = {
  headline: string;
  subcopy?: string;
  ctaLabel: string;
  tickerLines?: string[];
  /** Rendered below ticker, above main copy (e.g. funnel progress). */
  header?: ReactNode;
  theme?: FunnelTheme;
  onContinue: () => void;
};

export function PositioningGate({
  headline,
  subcopy,
  ctaLabel,
  tickerLines,
  header,
  theme = "emerald",
  onContinue,
}: Props) {
  const t = getThemeClasses(theme);

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white flex flex-col">
      {tickerLines?.length ? <SocialProofTicker lines={tickerLines} /> : null}
      {header}
      <div className="flex-1 flex flex-col justify-center px-6 py-10 max-w-lg mx-auto w-full">
        <h1 className="text-2xl font-bold tracking-tight mb-4 leading-tight">
          {headline}
        </h1>
        {subcopy ? (
          <p className="text-sm text-zinc-400 leading-relaxed mb-10">{subcopy}</p>
        ) : null}
        <button
          type="button"
          onClick={onContinue}
          className={`w-full py-4 rounded-xl font-semibold text-sm ${t.accentBg} text-black ${t.accentBgHover} transition-colors`}
        >
          {ctaLabel}
        </button>
      </div>
    </div>
  );
}
