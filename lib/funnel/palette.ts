import type { FunnelAccentPalette, FunnelVariantConfig } from "./types";

/** Preset matching the prior `amber` theme — warm CTAs across dark + light surfaces. */
export const funnelPaletteAmber: FunnelAccentPalette = {
  accentBg: "bg-amber-500",
  accentBgHover: "hover:bg-amber-400",
  accentButtonText: "text-zinc-950",
  accentText: "text-amber-400",
  accentTextOnLight: "text-amber-600",
  accentBorder: "border-amber-500",
  accentRing: "ring-amber-500",
  progressFrom: "from-amber-500",
  selectedBg: "bg-amber-500/10",
  primaryButtonShadow: "shadow-amber-900/25",
  questionnaireEyebrow: "text-amber-500/90",
  qualifyOptionSelected:
    "border-amber-500/70 bg-amber-500/[0.08] text-zinc-50 shadow-[0_0_0_1px_rgba(245,158,11,0.2)] ring-1 ring-amber-500/30",
  joinBandMutedText: "text-amber-100/85",
  joinBulletCardBorder: "border-amber-500/25",
  fomoActivityRing: "ring-amber-500/40",
  fomoSpotsLowBorder: "border-amber-600/70",
  fomoSpotsAccent: "text-amber-400/95",
  livePingOuter: "bg-amber-400",
  liveDot: "bg-amber-500",
  liveDotShadow: "shadow-[0_0_6px_rgba(245,158,11,0.85)]",
  liveLabel: "text-amber-400/95",
  pageRadialGlow:
    "bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(245,158,11,0.12),transparent)]",
  bridgeHeadline: "text-amber-400/95",
  bridgeSubline: "text-amber-400/90",
  bridgeCheckmark: "text-amber-500",
  bonusPanelBorder: "border-amber-500/20",
  bonusPanelBg: "bg-amber-500/5",
  bonusPanelAccent: "text-amber-400",
  bundleLineAccent: "text-amber-400/95",
  bundleToggleSelected: "border-amber-500 bg-amber-500/20 text-amber-100",
  bundleDiscountLabel: "text-amber-400",
  processingBackdrop:
    "bg-[radial-gradient(ellipse_70%_45%_at_50%_0%,rgba(245,158,11,0.1),transparent)]",
  processingDot: "bg-amber-500",
  valueBridgeEyebrow: "text-amber-500/90",
};

/** PHP-inspired light / violet accent stack (distinct from amber ad4). */
export const funnelPaletteVioletSky: FunnelAccentPalette = {
  accentBg: "bg-violet-600",
  accentBgHover: "hover:bg-violet-500",
  accentButtonText: "text-white",
  accentText: "text-sky-400",
  accentTextOnLight: "text-violet-700",
  accentBorder: "border-violet-500",
  accentRing: "ring-violet-500",
  progressFrom: "from-violet-500",
  selectedBg: "bg-violet-500/10",
  primaryButtonShadow: "shadow-violet-900/30",
  questionnaireEyebrow: "text-violet-400/95",
  qualifyOptionSelected:
    "border-violet-500/70 bg-violet-500/[0.12] text-zinc-50 shadow-[0_0_0_1px_rgba(139,92,246,0.25)] ring-1 ring-violet-500/35",
  joinBandMutedText: "text-violet-100/90",
  joinBulletCardBorder: "border-violet-400/30",
  fomoActivityRing: "ring-violet-400/45",
  fomoSpotsLowBorder: "border-violet-500/70",
  fomoSpotsAccent: "text-violet-300/95",
  livePingOuter: "bg-sky-400",
  liveDot: "bg-violet-500",
  liveDotShadow: "shadow-[0_0_6px_rgba(139,92,246,0.9)]",
  liveLabel: "text-sky-300/95",
  pageRadialGlow:
    "bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(56,189,248,0.14),transparent)]",
  bridgeHeadline: "text-sky-400/95",
  bridgeSubline: "text-violet-300/90",
  bridgeCheckmark: "text-sky-400",
  bonusPanelBorder: "border-violet-500/25",
  bonusPanelBg: "bg-violet-500/8",
  bonusPanelAccent: "text-violet-300",
  bundleLineAccent: "text-violet-300/95",
  bundleToggleSelected: "border-violet-500 bg-violet-500/25 text-violet-50",
  bundleDiscountLabel: "text-violet-300",
  processingBackdrop:
    "bg-[radial-gradient(ellipse_70%_45%_at_50%_0%,rgba(139,92,246,0.12),transparent)]",
  processingDot: "bg-violet-500",
  valueBridgeEyebrow: "text-sky-400/95",
};

export const funnelPaletteEmeraldSlate: FunnelAccentPalette = {
  accentBg: "bg-emerald-600",
  accentBgHover: "hover:bg-emerald-500",
  accentButtonText: "text-white",
  accentText: "text-emerald-400",
  accentTextOnLight: "text-emerald-700",
  accentBorder: "border-emerald-500",
  accentRing: "ring-emerald-500",
  progressFrom: "from-emerald-500",
  selectedBg: "bg-emerald-500/10",
  primaryButtonShadow: "shadow-emerald-900/25",
  questionnaireEyebrow: "text-emerald-500/90",
  qualifyOptionSelected:
    "border-emerald-500/70 bg-emerald-500/[0.1] text-zinc-50 shadow-[0_0_0_1px_rgba(16,185,129,0.2)] ring-1 ring-emerald-500/30",
  joinBandMutedText: "text-emerald-100/90",
  joinBulletCardBorder: "border-emerald-400/30",
  fomoActivityRing: "ring-emerald-400/45",
  fomoSpotsLowBorder: "border-emerald-500/70",
  fomoSpotsAccent: "text-emerald-300/95",
  livePingOuter: "bg-emerald-400",
  liveDot: "bg-emerald-500",
  liveDotShadow: "shadow-[0_0_6px_rgba(16,185,129,0.85)]",
  liveLabel: "text-emerald-300/95",
  pageRadialGlow:
    "bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(16,185,129,0.12),transparent)]",
  bridgeHeadline: "text-emerald-400/95",
  bridgeSubline: "text-emerald-300/90",
  bridgeCheckmark: "text-emerald-500",
  bonusPanelBorder: "border-emerald-500/20",
  bonusPanelBg: "bg-emerald-500/5",
  bonusPanelAccent: "text-emerald-400",
  bundleLineAccent: "text-emerald-400/95",
  bundleToggleSelected: "border-emerald-500 bg-emerald-500/20 text-emerald-50",
  bundleDiscountLabel: "text-emerald-300",
  processingBackdrop:
    "bg-[radial-gradient(ellipse_70%_45%_at_50%_0%,rgba(16,185,129,0.1),transparent)]",
  processingDot: "bg-emerald-500",
  valueBridgeEyebrow: "text-emerald-500/90",
};

export function getAccentPalette(cfg: FunnelVariantConfig): FunnelAccentPalette {
  return cfg.accentPalette ?? funnelPaletteAmber;
}
