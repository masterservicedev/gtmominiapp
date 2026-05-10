import type { FunnelTheme } from "./types";

export function getThemeClasses(theme: FunnelTheme = "emerald") {
  if (theme === "amber") {
    return {
      accentBg: "bg-amber-500",
      accentBgHover: "hover:bg-amber-400",
      accentText: "text-amber-400",
      accentBorder: "border-amber-500",
      accentRing: "ring-amber-500",
      progressFrom: "from-amber-500",
      selectedBg: "bg-amber-500/10",
    };
  }
  return {
    accentBg: "bg-emerald-500",
    accentBgHover: "hover:bg-emerald-400",
    accentText: "text-emerald-400",
    accentBorder: "border-emerald-500",
    accentRing: "ring-emerald-500",
    progressFrom: "from-emerald-500",
    selectedBg: "bg-emerald-500/10",
  };
}
