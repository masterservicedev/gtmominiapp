import type { AdVariant } from "@/lib/funnel/normalize";
import type { FunnelConfig } from "@/lib/funnel/framework";
import { ad4FunnelConfig } from "./ad4";
import { ad5FunnelConfig } from "./ad5";
import { ad6Config } from "./ad6";
import { ad7Config } from "./ad7";

const FUNNEL_TEMPLATES: Record<AdVariant, FunnelConfig> = {
  ad4: ad4FunnelConfig,
  ad5: ad5FunnelConfig,
  ad6: ad6Config,
  ad7: ad7Config,
};

export function getFunnelTemplateConfig(variant: AdVariant): FunnelConfig {
  return FUNNEL_TEMPLATES[variant] ?? ad4FunnelConfig;
}
