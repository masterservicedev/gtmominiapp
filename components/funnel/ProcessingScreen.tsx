"use client";

import type { FunnelTheme } from "@/lib/funnel/types";

type Props = {
  message?: string;
  theme?: FunnelTheme;
};

export function ProcessingScreen({
  message = "Reviewing your application…",
  theme = "emerald",
}: Props) {
  const dot =
    theme === "amber" ? "bg-amber-500" : "bg-emerald-500";

  return (
    <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-gradient-to-b from-zinc-950 via-black to-zinc-950 px-8">
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_70%_45%_at_50%_0%,rgba(245,158,11,0.1),transparent)]"
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
