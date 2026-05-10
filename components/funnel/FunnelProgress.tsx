"use client";

import { getThemeClasses } from "@/lib/funnel/theme";
import type { FunnelTheme } from "@/lib/funnel/types";

type Props = {
  current: number;
  total: number;
  label?: string;
  theme?: FunnelTheme;
};

export function FunnelProgress({
  current,
  total,
  label,
  theme = "emerald",
}: Props) {
  const t = getThemeClasses(theme);
  const pct = total > 0 ? Math.min(100, (current / total) * 100) : 0;

  return (
    <div className="w-full">
      <div className="w-full h-1 bg-zinc-800 rounded-full overflow-hidden">
        <div
          className={`h-full ${t.accentBg} transition-all duration-500 rounded-full`}
          style={{ width: `${pct}%` }}
        />
      </div>
      {label && (
        <p className="px-6 pt-2 text-xs text-zinc-500">{label}</p>
      )}
    </div>
  );
}
