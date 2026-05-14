import type { FunnelVariantConfig } from "./types";
import type { AdVariant } from "./normalize";
import { ad4VariantConfig } from "./content-ad4";
import { ad5VariantConfig } from "./content-ad5";

export const funnelContent: Record<AdVariant, FunnelVariantConfig> = {
  ad4: ad4VariantConfig,
  ad5: ad5VariantConfig,
};
