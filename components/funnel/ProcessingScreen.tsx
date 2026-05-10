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
    <div className="fixed inset-0 z-[100] bg-[#0a0a0a] flex flex-col items-center justify-center px-8">
      <div className="flex gap-1.5 mb-6" aria-hidden>
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className={`w-2 h-2 rounded-full ${dot} animate-bounce`}
            style={{ animationDelay: `${i * 0.15}s` }}
          />
        ))}
      </div>
      <p className="text-white text-sm font-medium text-center">{message}</p>
      <p className="text-zinc-500 text-xs mt-3 text-center">
        This usually takes a few seconds.
      </p>
    </div>
  );
}
