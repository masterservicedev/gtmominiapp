import type { FunnelConfig } from "@/lib/funnel/framework";

const VIDEO_SRC =
  typeof process !== "undefined"
    ? process.env.NEXT_PUBLIC_GTMO_AD5_VIDEO_URL ||
      process.env.NEXT_PUBLIC_GTMO_CODE_VIDEO_URL ||
      process.env.NEXT_PUBLIC_FUNNEL_VIDEO_URL ||
      ""
    : "";

/** Editorial light surface + violet accent — distinct from ad4. */
const ad5Theme = {
  pageBg: "#f0f2f5",
  pageText: "#111827",
  surfaceBg: "#ffffff",
  surfaceBorder: "#e5e7eb",
  cardBg: "#f9fafb",
  cardBorder: "#e5e7eb",
  mutedText: "#4b5563",
  headingColor: "#111827",
  headingFont: 'Merriweather, Georgia, "Times New Roman", serif',
  bodyFont:
    'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  accentBg: "#7c3aed",
  accentBgHover: "#8b5cf6",
  accentFg: "#ffffff",
  accentOnLight: "#5b21b6",
  bandFrom: "#1e1b4b",
  bandVia: "#312e81",
  bandTo: "#1e1b4b",
  bandText: "#fafafa",
  bandMuted: "rgba(196, 181, 253, 0.9)",
  bandBulletBorder: "rgba(139, 92, 246, 0.35)",
  stickyBg: "rgba(255, 255, 255, 0.96)",
  stickyBorder: "#e5e7eb",
  maxWidth: "72rem",
  heroPaddingY: "1.25rem",
  sectionPaddingY: "3rem",
} as const;

export const ad5FunnelConfig: FunnelConfig = {
  id: "ad5",
  name: "GTMO brief — editorial / violet",
  projectName: "GTMO Signals",
  primaryCtaLabel: "Apply for access",
  headerLogoSrc: "/logo-gtmo-crown.png",
  theme: ad5Theme,
  sections: [
    {
      type: "hero",
      headline:
        "Gold moved $35,000 in a single session. The people inside knew before it opened.",
      subheadline:
        "This is a live gold trading environment — every setup called before execution, every exit shared in real time. What follows shows you exactly what that looks like.",
      video: {
        src: VIDEO_SRC,
        minWatchSeconds: 0,
      },
      ctaLabel: "Apply for access",
    },
    {
      type: "stats",
      items: [
        {
          value: "$35K+",
          label:
            "secured in a single live NFP session — positions called before execution",
        },
        { value: "1,150+", label: "pips called live in a single trading week" },
        {
          value: "10,000+",
          label: "members inside the live environment right now",
        },
      ],
    },
    {
      type: "why",
      headline: "Most traders see gold move. The people inside GTMO see it before it moves.",
      subheadline:
        "That is not a marketing line. It is the structural difference between a live environment and everything else.",
      body: [
        "Every setup Mo takes is called before the position opens. Entry level, stop, target, reasoning — in real time, before execution. Not posted after the move closed. Not shared in a newsletter the following day.",
        "The $35,000 NFP session was called live. Members inside saw the setup, understood the entry, and were positioned before it opened. Everyone outside saw the result after the candle closed.",
        "That gap — between being positioned before and reacting after — is not about capital, experience, or skill. It is about access. And this intake round is currently open.",
      ],
      ctaLabel: "Apply now",
    },
    {
      type: "urgency",
      headline: "⚠️ This intake round is open. It will not stay open.",
      bullets: [
        "Each round is capped. When it fills, the next opens at a later date — not the next day.",
        "Live sessions are running right now. Every week outside is a week of setups you see after they close.",
        "Application takes under two minutes. Specialists follow up directly.",
      ],
    },
    {
      type: "why",
      headline: "Here is what separates consistent traders from everyone else.",
      subheadline: "It is not the signal. It is the moment the signal arrives.",
      body: [
        "A signals group sends an alert. By the time it arrives, the position is already moving. You are not trading the setup — you are chasing the result.",
        "A live environment calls the setup before the position opens. You see the entry level before it is relevant. You understand the stop before the trade is live. You know the target before price reaches it.",
        "The difference in outcome between these two approaches — over weeks, over months — is not marginal. It is the entire result.",
        "Inside GTMO, every session runs the same way. Entry before execution. Exit shared in real time. Reasoning explained throughout. This is what 10,000+ members are inside right now.",
      ],
    },
    {
      type: "how_it_works",
      headline: "How to get inside — three steps.",
      steps: [
        {
          number: 1,
          title: "Apply — questionnaire takes under two minutes",
          body: "Your capital level, experience, and readiness. Your answers determine your matched access path. Applications are reviewed in rounds — not every application is accepted.",
        },
        {
          number: 2,
          title: "A specialist confirms your access level",
          body: "Direct contact. They confirm your path, send your registration link, and handle every step. One message away through the entire process.",
        },
        {
          number: 3,
          title: "Fund your account — access activates",
          body: "Your funding goes into your own trading account — not to GTMO. Access activates as a partnership benefit after verification. You are inside, not watching from outside.",
        },
      ],
      ctaLabel: "Apply for access",
    },
    {
      type: "testimonials_slider",
      headline: "From inside the environment.",
      layout: "slider",
      items: [
        {
          name: "Laura A.",
          imageSrc: "/offer/media/laura.jpg",
          quote:
            "I watched setups close from outside for months. The day my access activated I understood what I had been missing — positioned before the move, not chasing it after.",
        },
        {
          name: "Chris H.",
          imageSrc: "/offer/media/chris.jpg",
          quote:
            "The $35K NFP session was what made me apply. Two months later I understand every decision in that session. Being inside is the only way to build that framework.",
        },
        {
          name: "Michael Z.",
          imageSrc: "/offer/media/michael.jpg",
          quote:
            "Every entry called before the position opens. That is not what signals groups do. That is what a live environment does. The difference is the entire result.",
        },
        {
          name: "Magda B.",
          imageSrc: "/offer/media/magda.jpg",
          quote:
            "Fast reversals used to catch me every time. Having the setup before the position opens changed that completely. Structure before execution is everything.",
        },
        {
          name: "Carl E.",
          imageSrc: "/offer/media/carl.jpg",
          quote:
            "I applied because of a session result I had missed from outside. I stayed because every session runs the same way — no exceptions, no retrospective calls.",
        },
      ],
    },
    {
      type: "authority_card",
      headline: "Mo — the trader behind the sessions.",
      name: "Full-time gold trader. 4+ years live track record.",
      imageSrc: "/offer/media/mo.jpg",
      body: [
        "The $35,000 NFP session is not the exception. It is what consistent, structured execution produces when the framework is applied correctly. Entry before execution. Exit shared in real time. Reasoning explained throughout — every session, every day.",
        "I built GTMO because there was no live environment available to retail traders where the reasoning was shown before execution — not after. Either theory courses or signals groups posting alerts after the move had already started.",
        "This intake round is open. The questionnaire takes under two minutes. A specialist confirms your access and handles everything from there. The sessions are running right now.",
      ],
      signOff: ["Mo"],
    },
    {
      type: "faq",
      headline: "Before you apply.",
      items: [
        {
          question: "Is the $35,000 session real?",
          answer:
            "Yes. It is a documented live session with positions visible throughout. It is evidence of what structured execution inside a live environment produces — not a guarantee of your results.",
        },
        {
          question: "What access level will I be matched to?",
          answer:
            "The questionnaire matches you based on capital and experience. Higher capital levels unlock VIP signal access — live setups called directly before Mo opens positions. All levels include live session access and specialist support.",
        },
        {
          question: "Does my money go to GTMO?",
          answer:
            "No. Your funding goes into your own trading account. GTMO access activates as a partnership benefit after your account is funded and verified.",
        },
        {
          question: "What happens after I apply?",
          answer:
            "A specialist contacts you directly. They confirm your access level, send your registration link, and walk you through every step. You are not left to figure it out alone.",
        },
      ],
    },
    {
      type: "cta",
      headline: "This round is open. The sessions are running.",
      subheadline:
        "Every week outside is a week of setups you see after they close. Application takes under two minutes.",
      ctaLabel: "Apply for access",
      disclaimer:
        "Trading involves risk. Results referenced are documented and not a guarantee of future performance. Your funding goes into your own trading account.",
    },
  ],
};
