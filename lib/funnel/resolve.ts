import { funnelContent } from "./content";
import type { AdVariant } from "./normalize";
import type { FunnelVariantConfig, OfferBlock } from "./types";

export function getFunnelConfig(variant: AdVariant): FunnelVariantConfig {
  return funnelContent[variant] ?? funnelContent.ad1;
}

export function getEffectiveOffer(variant: AdVariant): OfferBlock {
  const cfg = getFunnelConfig(variant);
  if (cfg.offer) return cfg.offer;
  const ref = cfg.offerVariantId ?? "ad1";
  const refCfg = funnelContent[ref];
  if (refCfg?.offer) return refCfg.offer;
  return funnelContent.ad1.offer!;
}

/** Screens before questionnaire: gate + (prelander?) + offer */
export function getPreQuestionnaireSteps(variant: AdVariant): number {
  if (variant === "ad2") return 3;
  return 2;
}
