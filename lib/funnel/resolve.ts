import { funnelContent } from "./content";
import { DEFAULT_AD_VARIANT, type AdVariant } from "./normalize";
import type { FunnelVariantConfig, OfferBlock } from "./types";

export function getFunnelConfig(variant: AdVariant): FunnelVariantConfig {
  return funnelContent[variant] ?? funnelContent[DEFAULT_AD_VARIANT];
}

export function getEffectiveOffer(variant: AdVariant): OfferBlock {
  const cfg = getFunnelConfig(variant);
  if (cfg.offer) return cfg.offer;
  const ref = cfg.offerVariantId ?? DEFAULT_AD_VARIANT;
  const refCfg = funnelContent[ref];
  if (refCfg?.offer) return refCfg.offer;
  return funnelContent[DEFAULT_AD_VARIANT].offer!;
}

/** Screens before questionnaire: gate + offer (code_landing variants). Always 2 for ad4/ad5. */
export function getPreQuestionnaireSteps(): number {
  return 2;
}
