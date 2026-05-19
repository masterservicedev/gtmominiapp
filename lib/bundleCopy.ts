import type { Capital } from "@/lib/scoring";

/**
 * Single source of truth for mini-app activation bonus copy.
 *
 * Six surfaces consume these strings:
 *  - agentEligibleBonus     → Chatwoot lead card "Eligible Bonus" line
 *  - agentSuggestedClose    → Chatwoot lead card "Suggested Close" (bundle path)
 *  - agentPrimaryOnlyClose  → Chatwoot lead card "Suggested Close" when the user
 *                              actively declined the bundle in the mini app
 *  - customerDmLine         → Customer-facing Telegram / Chatwoot outbound DM
 *  - userPanelHeadline      → Headline shown on /value-bridge, /product-match, /confirm-intent
 *  - userPanelBody          → Body copy under the headline on those panels
 */
export type BundleCopy = {
  agentEligibleBonus: string;
  agentSuggestedClose: string;
  agentPrimaryOnlyClose: string;
  customerDmLine: string;
  userPanelHeadline: string;
  userPanelBody: string;
};

const BUNDLE_COPY: Record<Capital, BundleCopy> = {
  under_100: {
    agentEligibleBonus: "+ Ebook included with MT5 Guide after deposit 🎁",
    agentSuggestedClose: "$50 deposit → MT5 Guide + Ebook included 🎁",
    agentPrimaryOnlyClose: "$50 deposit → MT5 Guide access only",
    customerDmLine: "Mini app activation bonus included: MT5 Guide + Ebook.",
    userPanelHeadline: "Starter access: MT5 Guide + Ebook",
    userPanelBody:
      "When you fund your account with $50+, MT5 Guide and the GTMO Ebook are activated to help you start with the right setup and framework.",
  },

  "100_300": {
    agentEligibleBonus: "+ MT5 Guide included after deposit 🎁",
    agentSuggestedClose: "$100 deposit → VIP + MT5 Guide included 🎁",
    agentPrimaryOnlyClose: "$100 deposit → VIP access only",
    customerDmLine: "Mini app activation bonus included: VIP + MT5 Guide.",
    userPanelHeadline: "MT5 Guide included with VIP",
    userPanelBody:
      "When you fund your account with $100+, VIP access is activated and the MT5 Guide is included as your mini app activation bonus.",
  },

  "300_1000": {
    agentEligibleBonus: "+ Ebook included after deposit 🎁",
    agentSuggestedClose: "$200 deposit → FX Basics + Ebook included 🎁",
    agentPrimaryOnlyClose: "$200 deposit → FX Basics access only",
    customerDmLine: "Mini app activation bonus included: FX Basics + Ebook.",
    userPanelHeadline: "Ebook included with FX Basics",
    userPanelBody:
      "When you fund your account with $200+, FX Basics is activated and the GTMO Ebook is included as your mini app activation bonus.",
  },

  "1000_plus": {
    agentEligibleBonus: "+ 1 free product after deposit 🎁",
    agentSuggestedClose:
      "$500 deposit → School + 1 product of choice free 🎁",
    agentPrimaryOnlyClose: "$500 deposit → School access only",
    customerDmLine:
      "Mini app activation bonus included: School + one free product.",
    userPanelHeadline: "One additional product included",
    userPanelBody:
      "When you fund your account with $500+, School access is activated and one additional product is included as your mini app activation bonus.",
  },
};

const NON_BUNDLE_AGENT_CLOSE: Record<Capital, string> = {
  under_100: "$50 deposit → MT5 Guide + Ebook",
  "100_300": "$100 deposit → VIP access",
  "300_1000": "$200 deposit → FX Basics",
  "1000_plus": "$500 deposit → School access",
};

export function getBundleCopy(capital: Capital): BundleCopy {
  return BUNDLE_COPY[capital];
}

export function getNonBundleAgentClose(capital: Capital): string {
  return NON_BUNDLE_AGENT_CLOSE[capital];
}
