import { funnelContent } from "./content";
import type { AdVariant } from "./normalize";
import type { FunnelVariantConfig, OfferBlock } from "./types";

export function getFunnelConfig(variant: AdVariant): FunnelVariantConfig {
  return funnelContent[variant] ?? funnelContent.ad4;
}

export function getEffectiveOffer(variant: AdVariant): OfferBlock {
  const cfg = getFunnelConfig(variant);
  if (cfg.offer) return cfg.offer;
  const ref = cfg.offerVariantId ?? "ad4";
  const refCfg = funnelContent[ref];
  if (refCfg?.offer) return refCfg.offer;
  return funnelContent.ad4.offer!;
}

/** Screens before questionnaire: gate + offer. Always 2 for funnel_template variants (ad4/ad5/ad6). */
export function getPreQuestionnaireSteps(): number {
  return 2;
}
