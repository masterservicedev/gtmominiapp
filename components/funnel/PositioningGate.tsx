"use client";

import type { ReactNode } from "react";
import type { FunnelTheme } from "@/lib/funnel/types";
import { getThemeClasses } from "@/lib/funnel/theme";
import { SocialProofTicker } from "./SocialProofTicker";

type Props = {
  headline: string;
  subcopy?: string;
  ctaLabel: string;
  logoSrc?: string;
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
  logoSrc,
  tickerLines,
  header,
  theme = "emerald",
  onContinue,
}: Props) {
  const t = getThemeClasses(theme);
  const centered = Boolean(logoSrc);
  const subParagraphs = subcopy?.includes("\n\n")
    ? subcopy.split("\n\n").filter(Boolean)
    : subcopy
      ? [subcopy]
      : [];

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white flex flex-col">
      {tickerLines?.length ? <SocialProofTicker lines={tickerLines} /> : null}
      {header}
      <div
        className={`flex-1 flex flex-col justify-center px-6 py-10 max-w-lg mx-auto w-full ${
          centered ? "items-center text-center" : ""
        }`}
      >
        {logoSrc ? (
          <div className="gate-logo-wrap mx-auto mb-8 w-full max-w-[220px]">
            <div className="gate-logo-shine relative inline-block w-full">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={logoSrc}
                alt="Gold Trader Mo"
                className="relative z-[1] mx-auto block h-auto w-full max-w-[220px] object-contain"
                width={220}
                height={220}
              />
              <span
                className="gate-logo-shine-overlay pointer-events-none absolute inset-0 z-[2] overflow-hidden rounded-lg"
                aria-hidden
              />
            </div>
          </div>
        ) : null}
        <h1 className="text-2xl font-bold tracking-tight mb-4 leading-tight">
          {headline}
        </h1>
        {subParagraphs.length > 0 ? (
          <div
            className={`space-y-4 text-sm text-zinc-400 leading-relaxed mb-10 ${
              centered ? "max-w-md" : ""
            }`}
          >
            {subParagraphs.map((p, i) => (
              <p key={i}>{p}</p>
            ))}
          </div>
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
