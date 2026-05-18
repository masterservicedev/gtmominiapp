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
 *
 * `under_100` has no paid offer in the live funnel (channel access only); it
 * therefore has no bundle copy.
 */
export type BundleCopy = {
  agentEligibleBonus: string;
  agentSuggestedClose: string;
  agentPrimaryOnlyClose: string;
  customerDmLine: string;
  userPanelHeadline: string;
  userPanelBody: string;
};

const BUNDLE_COPY: Record<Capital, BundleCopy | null> = {
  under_100: null,

  "100_300": {
    agentEligibleBonus: "+ Ebook included free after deposit 🎁",
    agentSuggestedClose: "$100 deposit → VIP + Ebook included 🎁",
    agentPrimaryOnlyClose: "$100 deposit → VIP access only",
    customerDmLine: "Mini app activation bonus included: VIP + Ebook.",
    userPanelHeadline: "Ebook included with VIP access",
    userPanelBody:
      "When you fund your account with $100+, VIP access is activated and the GTMO Ebook is included as your mini app activation bonus.",
  },

  "300_1000": {
    agentEligibleBonus: "+ 50% off second product after deposit 🎁",
    agentSuggestedClose:
      "$200 deposit → Primary access + 50% off second product 🎁",
    agentPrimaryOnlyClose: "$200 deposit → Primary access only",
    customerDmLine:
      "Mini app activation bonus included: choose a second product at 50% off.",
    userPanelHeadline: "Second product at 50% off",
    userPanelBody:
      "When you fund your account with $200+, your primary access is activated and you can add a second product at 50% off.",
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
  under_100: "No current offer — channel access only",
  "100_300": "$100 deposit → VIP access",
  "300_1000": "$200 deposit → FX Basics or Education",
  "1000_plus": "$500 deposit → School access",
};

export function getBundleCopy(capital: Capital): BundleCopy | null {
  return BUNDLE_COPY[capital] ?? null;
}

export function getNonBundleAgentClose(capital: Capital): string {
  return NON_BUNDLE_AGENT_CLOSE[capital];
}
