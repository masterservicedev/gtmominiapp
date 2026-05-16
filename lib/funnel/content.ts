import type { FunnelVariantConfig } from "./types";
import type { AdVariant } from "./normalize";
import { ad4VariantConfig } from "./content-ad4";
import { ad5VariantConfig } from "./content-ad5";
import { ad6VariantConfig } from "./content-ad6";
import { ad7VariantConfig } from "./content-ad7";
import { ad8VariantConfig } from "./content-ad8";
import { ad9VariantConfig } from "./content-ad9";
import { ad10VariantConfig } from "./content-ad10";

export const funnelContent: Record<AdVariant, FunnelVariantConfig> = {
  ad4: ad4VariantConfig,
  ad5: ad5VariantConfig,
  ad6: ad6VariantConfig,
  ad7: ad7VariantConfig,
  ad8: ad8VariantConfig,
  ad9: ad9VariantConfig,
  ad10: ad10VariantConfig,
};
