import type { Capital } from "@/lib/scoring";
import type { ProductKey } from "@/lib/productMatch";

export interface ProductDetail {
  key: ProductKey;
  displayName: string;
  tagline: string;
  oneLiner: string;
  depositRequiredUsd: number;
  benefitBullets: string[];
  emphasis: {
    structured: number;
    live: number;
    community: number;
    label: string;
  };
}

export const productCatalog: Record<ProductKey, ProductDetail> = {
  starter: {
    key: "starter",
    displayName: "MT5 Guide + Ebook",
    tagline: "Start with the right setup",
    oneLiner:
      "MT5 Guide for practical MT5 setup and execution — personally written by MO — plus the GTMO Ebook for the signal framework and mindset.",
    depositRequiredUsd: 50,
    benefitBullets: [
      "MT5 Guide — practical MT5 setup and execution, personally written by MO",
      "GTMO Ebook — strategy, mindset, and signal framework",
      "Designed for traders starting with limited capital who need structure first",
      "Instant digital access after your account is funded and verified",
    ],
    emphasis: {
      structured: 70,
      live: 10,
      community: 20,
      label: "Starter setup + framework before you scale capital",
    },
  },

  mt5_guide: {
    key: "mt5_guide",
    displayName: "MT5 Guide",
    tagline: "Practical MT5 setup and execution guide",
    oneLiner:
      "Personally written by MO — practical MT5 setup and execution.",
    depositRequiredUsd: 50,
    benefitBullets: [
      "Step-by-step MT5 setup and configuration",
      "Execution workflow for following GTMO signals correctly",
      "Risk and position-sizing fundamentals on MT5",
      "Personally written by MO — not generic third-party content",
    ],
    emphasis: {
      structured: 85,
      live: 5,
      community: 10,
      label: "Hands-on MT5 execution guide",
    },
  },

  ebook: {
    key: "ebook",
    displayName: "GTMO Ebook",
    tagline: "5 Steps to Trading GTMO Signals",
    oneLiner:
      "A 56-page structured guide to understanding and executing GTMO signals correctly.",
    depositRequiredUsd: 50,
    benefitBullets: [
      "56 pages of structured trading knowledge",
      "Step-by-step breakdown of the GTMO signal strategy",
      "Entry, exit, and risk management explained clearly",
      "Written by the trader behind the channel — not a ghostwriter",
      "Designed for traders at any level who want to understand the why behind each call",
      "Instant digital access on purchase",
    ],
    emphasis: {
      structured: 80,
      live: 0,
      community: 20,
      label: "Self-paced, strategy-focused reading",
    },
  },

  vip: {
    key: "vip",
    displayName: "GTMO VIP",
    tagline: "Live Signals. Real Edge. Daily.",
    oneLiner:
      "Full access to daily signals across Gold, Crypto, and FX — plus a community of active traders.",
    depositRequiredUsd: 100,
    benefitBullets: [
      "Daily signals across Gold (XAU/USD), Crypto, and major FX pairs",
      "Direct access to the affiliated trading broker",
      "Deposit bonuses and exclusive broker promotions",
      "Community of traders following the same setups",
      "Daily market analysis from GTMO",
      "Exclusive content not published in the free channel",
    ],
    emphasis: {
      structured: 20,
      live: 50,
      community: 30,
      label: "Live signals, active community, daily execution",
    },
  },

  fx_basics: {
    key: "fx_basics",
    displayName: "FX Basics",
    tagline: "Everything Forex — Explained from the Ground Up",
    oneLiner:
      "A dedicated channel covering Forex fundamentals for members who want to understand the market before trading it.",
    depositRequiredUsd: 200,
    benefitBullets: [
      "Complete beginner-to-intermediate Forex curriculum",
      "Covers pairs, pips, lot sizes, leverage, and risk management",
      "Explains how to read and act on GTMO signals correctly",
      "Channel-style delivery — digestible lessons, not dense textbooks",
      "Ongoing support from the GTMO team",
      "Ideal for members new to Forex who want a structured starting point",
    ],
    emphasis: {
      structured: 70,
      live: 10,
      community: 20,
      label: "Curriculum-led with ongoing channel support",
    },
  },

  education: {
    key: "education",
    displayName: "GTMO Education",
    tagline: "Insights and Key Learning Materials — Daily",
    oneLiner:
      "A private education channel delivering ongoing market insights, learning materials, and trading context alongside the main signals.",
    depositRequiredUsd: 200,
    benefitBullets: [
      "Private channel with regular market insights from the GTMO trader",
      "Key learning materials covering strategy, analysis, and execution",
      "Designed to run alongside the free signals channel — not replace it",
      "Helps members understand the reasoning behind each trade call",
      "Covers market conditions, timing, and risk context in plain language",
      "Ongoing content — not a one-time course, updated as markets move",
    ],
    emphasis: {
      structured: 40,
      live: 35,
      community: 25,
      label: "Ongoing insights with live market context",
    },
  },

  school: {
    key: "school",
    displayName: "GTMO School",
    tagline: "The Complete Trading Programme",
    oneLiner:
      "The most comprehensive offering in the GTMO ecosystem — video courses, live sessions, and exclusive strategies from the ground up.",
    depositRequiredUsd: 500,
    benefitBullets: [
      "Full access to all GTMO video courses — structured curriculum from beginner to advanced",
      "Exclusive chart views and technical analysis not shared publicly",
      "Live trading sessions — watch positions being opened and managed in real time",
      "Exclusive strategies from the GTMO himself!",
      "Instant access to all course content on enrolment",
      "Exclusive member pricing on future GTMO products and events",
    ],
    emphasis: {
      structured: 50,
      live: 30,
      community: 20,
      label: "Full programme — courses, live sessions, strategy",
    },
  },
};

export interface BundleRule {
  description: string;
  discountLabel: string;
  eligibleKeys: ProductKey[];
  disclaimer: string;
}

export function getBundleSecondaryOptions(capital: Capital): BundleRule | null {
  switch (capital) {
    case "under_100":
      return {
        description:
          "MT5 Guide and GTMO Ebook — activated together when you fund your account with $50+.",
        discountLabel: "included",
        eligibleKeys: ["mt5_guide", "ebook"],
        disclaimer:
          "Starter access activates after deposit confirmation via your registration link.",
      };

    case "100_300":
      return {
        description: "MT5 Guide included with your VIP access",
        discountLabel: "included",
        eligibleKeys: ["mt5_guide"],
        disclaimer:
          "MT5 Guide access activated alongside VIP on deposit confirmation.",
      };

    case "300_1000":
      return {
        description: "GTMO Ebook included with FX Basics",
        discountLabel: "included",
        eligibleKeys: ["ebook"],
        disclaimer:
          "Ebook access activated alongside FX Basics on deposit confirmation.",
      };

    case "1000_plus":
      return {
        description: "One additional product of your choice — completely free",
        discountLabel: "free",
        eligibleKeys: ["ebook", "mt5_guide", "fx_basics", "vip"],
        disclaimer:
          "Choose from Ebook, MT5 Guide, FX Basics, or VIP when speaking with your specialist. Activated on deposit confirmation.",
      };

    default:
      return null;
  }
}

export function getCatalogProduct(key: ProductKey): ProductDetail {
  return productCatalog[key];
}

export function getEmphasisDisplay(product: ProductDetail): string[] {
  const { structured, live, community, label } = product.emphasis;
  return [
    `${structured}% structured learning content`,
    `${live}% live market engagement`,
    `${community}% community and signals access`,
    label,
  ];
}
