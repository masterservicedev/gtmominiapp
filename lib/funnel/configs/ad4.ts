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
    {
      type: "hero_split",
      video: { src: VIDEO_SRC, minWatchSeconds: 0 },
      intro: {
        h1: "Markets reward clarity and discipline — not noise.",
        h2: "1,150+ pips delivered this week.",
        h2b: "$35,000 secured on a single NFP setup.",
        h3:
          "This isn't a signals group. It's a live trading environment run by someone who manages risk in real time and shows you every move.",
      },
      urgencyAside: {
        eyebrow: "Private intake",
        headline:
          "Complete the brief, then continue to your application while this window is open.",
        bullets: [
          "We limit daily onboarding so everyone gets a fair, orderly path — not a rush.",
          "One straight line: watch → short questionnaire → next step. No duplicate steps.",
          "Nothing here is a promise of results — only education and honest risk language.",
        ],
      },
    },
    {
      type: "join",
      headline: "Join The {projectName}",
      paragraphs: [
        "**The {projectName}** is a group reserved exclusively to people who took advantage of strong opportunities in the gold market and quietly built substantial profits along the way.",
        "**{projectName} Members** enjoy retreats around the world every month while they make money on their laptop with just a few minutes of “work” every day.",
      ],
    },
    {
      type: "urgency_band",
      title: "Why thoughtful timing matters",
      subtitle:
        "Waiting often means missing context you needed to understand the full picture.",
      bullets: [
        "Places are offered in rounds — when a round closes, the next one may be later.",
        "A short application helps us route you properly instead of overloading the team.",
        "If gold matters to you, deciding when to engage is still a decision — make it an informed one.",
      ],
    },
    {
      type: "testimonials",
      sectionTitle: "What members say",
      items: [
        {
          name: "Laura Abenstein",
          imageFile: "/offer/media/laura.jpg",
          quote:
            "47 days in and the shift is real — first major milestone hit and great people around me. Thanks, Mo!",
        },
        {
          name: "Joey Feldman",
          imageFile: "/offer/media/joey.jpg",
          quote:
            "Two months with the {projectName} system and my debt picture changed fast. Grateful for the structure and support.",
        },
        {
          name: "Michael Zusman",
          imageFile: "/offer/media/michael.jpg",
          quote:
            "The system does what it says on the tin — consistency I did not expect this quickly.",
        },
        {
          name: "Paulo Fonzi",
          imageFile: "/offer/media/paulo.jpg",
          quote:
            "Big life change in a short window — the channel and Mo’s process made the difference.",
        },
        {
          name: "Lewis H.",
          imageFile: "/offer/media/lewis.jpg",
          quote:
            "Joined recently and the account trajectory surprised me — in a good way.",
        },
        {
          name: "Chris Hadid",
          imageFile: "/offer/media/chris.jpg",
          quote:
            "Morning routine is different now — clarity on risk and a path I can follow.",
        },
        {
          name: "Daniel Pelts",
          imageFile: "/offer/media/daniel.jpg",
          quote:
            "Came from a finance background — this execution style is different. Team is asking how I did it.",
        },
        {
          name: "Magda Boltyanski",
          imageFile: "/offer/media/magda.jpg",
          quote:
            "Feels like I finally have a seat at the table — {projectName} gave me a real framework.",
        },
        {
          name: "Carl Edwards",
          imageFile: "/offer/media/carl.jpg",
          quote:
            "Rough patch before I joined — stability and direction came back faster than I thought.",
        },
      ],
    },
    {
      type: "authority",
      title: "Meet Gold Trader Mo",
      subtitleLines: ["The Genius Behind The", "GTMO Signals"],
      bodyParagraphs: [
        "Hi — I’m Mo. I’m a **full-time trader** with **4+ years** of track record in this industry — not a spectator, not a hobbyist.",
        "I built a gold-focused framework and tools around disciplined execution and risk — the kind of structure you need when markets move against you.",
        "This presentation is about process and fit — not hype. Watch the brief above, then continue only if you’re ready for honest risk talk and a clear next step.",
        "If you want to explore how we approach gold with structure, the video above is the fastest way to see whether this path aligns with you.",
      ],
      imageFile: "/offer/media/mo.jpg",
      signOffLines: ["Your Friend,", "Mo"],
    },
  ],
};
