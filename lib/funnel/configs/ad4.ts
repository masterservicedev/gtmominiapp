import type { FunnelConfig } from "@/lib/funnel/framework";

const VIDEO_SRC =
  typeof process !== "undefined"
    ? process.env.NEXT_PUBLIC_GTMO_CODE_VIDEO_URL ||
      process.env.NEXT_PUBLIC_FUNNEL_VIDEO_URL ||
      ""
    : "";

/** Light zinc/stone stack + amber accent — aligned to prior CodeLandingOffer look. */
const ad4Theme = {
  pageBg: "#fafaf9",
  pageText: "#18181b",
  surfaceBg: "#ffffff",
  surfaceBorder: "rgba(228, 228, 231, 0.9)",
  cardBg: "rgba(250, 250, 249, 0.6)",
  cardBorder: "rgba(228, 228, 231, 0.9)",
  mutedText: "#52525b",
  headingColor: "#18181b",
  headingFont:
    'ui-serif, Georgia, Cambria, "Times New Roman", Times, serif',
  bodyFont:
    'ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  accentBg: "#f59e0b",
  accentBgHover: "#fbbf24",
  accentFg: "#18181b",
  accentOnLight: "#d97706",
  bandFrom: "#09090b",
  bandVia: "#18181b",
  bandTo: "#09090b",
  bandText: "#fafafa",
  bandMuted: "rgba(254, 243, 199, 0.85)",
  bandBulletBorder: "rgba(245, 158, 11, 0.25)",
  stickyBg: "rgba(255, 255, 255, 0.95)",
  stickyBorder: "rgba(228, 228, 231, 0.8)",
  maxWidth: "72rem",
  heroPaddingY: "1.25rem",
  sectionPaddingY: "3rem",
} as const;

export const ad4FunnelConfig: FunnelConfig = {
  id: "ad4",
  name: "GTMO brief — light / amber",
  projectName: "GTMO Signals",
  primaryCtaLabel: "Continue to application",
  headerLogoSrc: "/logo-gtmo-crown.png",
  theme: ad4Theme,
  sections: [
    // ── Hero ──────────────────────────────────────────────────────────────
    {
      type: "hero",
      headline: "Markets reward clarity and discipline — not noise.",
      subheadline:
        "A live gold trading environment where every entry is called before execution, every stop is explained, and every exit is documented in real time. This is what process over opinion looks like.",
      video: {
        src: VIDEO_SRC,
        minWatchSeconds: 0,
      },
    },

    // ── Stats ──────────────────────────────────────────────────────────────
    {
      type: "stats",
      items: [
        {
          value: "1,150+",
          label: "pips called live in a single week — every setup before execution",
        },
        {
          value: "$2M+",
          label: "withdrawn live on camera — full proof, no edits",
        },
        {
          value: "10,000+",
          label: "members across the live environment right now",
        },
      ],
    },

    // ── What GTMO is ───────────────────────────────────────────────────────
    {
      type: "why",
      headline: "Your investments deserve a system. Not another opinion.",
      subheadline: "Live execution. Full transparency. Every call documented.",
      body: [
        "Most trading communities react to what already happened. GTMO is built around a different principle: every setup is called before the position opens. Entry level, stop, target, and the reasoning behind each decision — shared in real time, before execution.",
        "That is not a claim. It is a structure that runs every trading day. Members inside see the setup. Everyone outside sees the result.",
        "We do not post recaps. We do not explain entries after they close. The live session is the product — and the transparency of it is what members verify for themselves.",
      ],
    },

    // ── Capital preservation framing ───────────────────────────────────────
    {
      type: "why",
      headline: "We trade. We do not perform.",
      subheadline:
        "Every call timestamped. Every stop explained. Every exit shared before it closes.",
      body: [
        "Risk management is not an afterthought inside GTMO — it is the first conversation. The stop level is defined before the position opens. The target is stated before price reaches it. The exit is shared with members in real time, not announced after the fact.",
        "This is not a highlight reel. The losing sessions are visible. The reasoning behind every decision is part of the record. Members do not take our word for anything — they are inside the session when it happens.",
        "Capital preservation first. Process over performance. That is the framework.",
      ],
    },

    // ── Weekly workflow (BMB-style) ────────────────────────────────────────
    {
      type: "how_it_works",
      headline: "Your weekly workflow inside GTMO.",
      steps: [
        {
          number: 1,
          title: "Follow the live session",
          body: "Mo calls every setup before the position opens. Entry, stop, target, reasoning — in real time. You see the trade built from the analysis up, not reported after the close.",
        },
        {
          number: 2,
          title: "Understand the framework",
          body: "Every session explains not just what is being traded but why. Market structure, entry logic, risk-to-reward — all visible. Members build a repeatable framework by following, not just copying.",
        },
        {
          number: 3,
          title: "Your specialist handles the rest",
          body: "After your application is matched, a specialist confirms your access level and walks you through every step. One message away through the entire process. You are not left to figure it out alone.",
        },
      ],
    },

    // ── Verified track record ──────────────────────────────────────────────
    {
      type: "why",
      headline: "Every major call. Documented. You can verify it.",
      body: [
        "The $35,000 NFP session was called live before the position opened. The entry level was shared before price reached it. The exit was announced before the close. Members inside were positioned. Everyone outside saw the result.",
        "The 1,150+ pip week ran the same way — setup by setup, each one called before execution. The total is not a weekly average or a selected highlight. It is the documented sum of setups called live across that week.",
        "We do not ask you to take our word for any of this. The sessions are live. The record is visible to members from day one. That transparency is not a marketing feature — it is the product.",
      ],
    },

    // ── Who it's for ───────────────────────────────────────────────────────
    {
      type: "why",
      headline: "GTMO is for serious traders. Not for everyone.",
      subheadline:
        "We maintain standards because the quality of the environment depends on the quality of the people inside it.",
      body: [
        "We are looking for people who want a process — not a promise. If you need guaranteed returns or passive income framing to engage, this is not the right fit.",
        "We are looking for people who treat risk as a first conversation — not an afterthought. If your approach is to deploy large capital on a single position and hope for the best, this is not the right environment.",
        "We are looking for people who want to understand what they are doing — not just follow alerts. The live sessions are built around explanation, not just execution. Members who engage with the reasoning build frameworks. Members who want signals without context are better served elsewhere.",
        "If you are serious about gold, about process, and about operating with clarity — the application is short and the specialist follow-up is direct.",
      ],
    },

    // ── Testimonials ───────────────────────────────────────────────────────
    {
      type: "testimonials_slider",
      headline: "Real investors. Real outcomes.",
      layout: "slider",
      items: [
        {
          name: "Laura A.",
          imageSrc: "/offer/media/laura.jpg",
          quote:
            "47 days in and the shift is real — first major milestone hit. The framework Mo explains in every session is what built it.",
        },
        {
          name: "Joey F.",
          imageSrc: "/offer/media/joey.jpg",
          quote:
            "Two months following the live sessions and my approach completely changed. The structure is what I was missing — not the signals.",
        },
        {
          name: "Michael Z.",
          imageSrc: "/offer/media/michael.jpg",
          quote:
            "Came from a finance background. The execution transparency here is different from anything I had seen. Every decision is visible before it is made.",
        },
        {
          name: "Paulo F.",
          imageSrc: "/offer/media/paulo.jpg",
          quote:
            "Big change in a short window. Following Mo's process — not just his calls — is what made the difference.",
        },
        {
          name: "Daniel P.",
          imageSrc: "/offer/media/daniel.jpg",
          quote:
            "The team started asking what I was doing differently. Explained the framework. They could not believe the transparency of the live sessions.",
        },
        {
          name: "Magda B.",
          imageSrc: "/offer/media/magda.jpg",
          quote:
            "I finally have a framework instead of opinions. The live environment builds it in a way no course ever did.",
        },
      ],
    },

    // ── Authority ──────────────────────────────────────────────────────────
    {
      type: "authority_card",
      headline: "Meet Gold Trader Mo.",
      name: "Founder, GTMO Signals. Full-time gold trader, 4+ years live track record.",
      imageSrc: "/offer/media/mo.jpg",
      body: [
        "I built GTMO because I was frustrated by the options available to retail gold traders. Either pay for a theory course, or follow a signals group that posts alerts after the move has started. There was no live environment where the reasoning was shown before execution — and transparency was the actual product.",
        "Every position I take is called live before it opens. Every stop is stated before the position is live. Every exit is shared before price reaches it. The record is visible. Members verify it for themselves.",
        "I do not manage your money. I do not tell you what to do. I show you exactly what I am doing, why, and at what levels — in real time, every trading day. What you do with that is your decision.",
        "If that sounds like what you have been looking for, the application is short and the specialist follow-up is direct.",
      ],
      signOff: ["Mo"],
    },

    // ── FAQ ───────────────────────────────────────────────────────────────
    {
      type: "faq",
      headline: "Questions before you apply.",
      items: [
        {
          question: "How is this different from a signals group?",
          answer:
            "A signals group sends alerts — usually after the position is already moving. GTMO calls every setup before Mo opens the position. Entry, stop, target, reasoning — before execution. The transparency is the difference, not the frequency of alerts.",
        },
        {
          question: "How much time does this require per week?",
          answer:
            "Live sessions run during active gold trading hours. Most members follow the sessions, understand the framework, and move on with their week. The depth of engagement is yours to choose — the system is designed so that following the process does not consume your life.",
        },
        {
          question: "Does my money go to GTMO?",
          answer:
            "No. Your funding goes into your own trading account. GTMO access activates as a partnership benefit after your account is funded and verified. You trade your own capital. We never touch it.",
        },
        {
          question: "What access level will I be matched to?",
          answer:
            "The questionnaire matches you based on capital and experience. Higher capital levels unlock VIP signal access — live setups called directly before Mo opens positions. All levels include live session access and specialist support.",
        },
        {
          question: "What happens after I apply?",
          answer:
            "A specialist contacts you directly. They confirm your matched access level, send your registration link, and walk you through every step. Applications are reviewed in rounds — not every application is accepted.",
        },
      ],
    },

    // ── Final CTA ──────────────────────────────────────────────────────────
    {
      type: "cta",
      headline:
        "Every week without a system is a week of setups you see after they close.",
      subheadline:
        "Application takes under two minutes. Specialists follow up directly. Intake is reviewed in rounds.",
      disclaimer:
        "Trading involves risk. Results referenced are documented and not a guarantee of future performance. Your funding goes into your own trading account.",
    },
  ],
};
