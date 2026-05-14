import type { FunnelVariantConfig } from "./types";
import { funnelPaletteAmber } from "./palette";

const VIDEO_SRC =
  typeof process !== "undefined"
    ? process.env.NEXT_PUBLIC_GTMO_CODE_VIDEO_URL ||
      process.env.NEXT_PUBLIC_FUNNEL_VIDEO_URL ||
      ""
    : "";

export const ad4VariantConfig: FunnelVariantConfig = {
  accentPalette: funnelPaletteAmber,
  positioningGate: {
    /** Step 1 gate only — crown / brand mark on the positioning screen. */
    logoSrc: "/offer/media/gtmologo.png",
    headline: "Most traders fail because they're alone.",
    subcopy: [
      "Wrong information. No structure. No one to follow who actually trades.",
      "That changes here. Follow someone who trades live every single day — and builds real positions in real time.",
      "This intake is limited. Serious applicants only.",
    ].join("\n\n"),
    ctaLabel: "Continue",
  },
  socialProofTicker: [
    "Applications reviewed in real time — queue moves quickly",
    "Next step: short questionnaire — takes under two minutes",
    "Education-first — risk-aware framing only",
  ],
  offer: {
    mode: "code_landing",
    projectName: "GTMO Signals",
    headerLogoSrc: "/logo-gtmo-crown.png",
    primaryCtaLabel: "Continue to application",
    video: {
      src: VIDEO_SRC,
      minWatchSeconds: 0,
    },
    intro: {
      h1: "Markets reward clarity and discipline — not noise.",
      h2: "1,150+ pips delivered this week.",
      h2b: "$35,000 secured on a single NFP setup.",
      h3: "This isn't a signals group. It's a live trading environment run by someone who manages risk in real time and shows you every move.",
    },
    urgencyAside: {
      eyebrow: "Private intake",
      headline: "Complete the brief, then continue to your application while this window is open.",
      bullets: [
        "We limit daily onboarding so everyone gets a fair, orderly path — not a rush.",
        "One straight line: watch → short questionnaire → next step. No duplicate steps.",
        "Nothing here is a promise of results — only education and honest risk language.",
      ],
    },
    midPageUrgency: {
      title: "Why thoughtful timing matters",
      subtitle:
        "Waiting often means missing context you needed to understand the full picture.",
      bullets: [
        "Places are offered in rounds — when a round closes, the next one may be later.",
        "A short application helps us route you properly instead of overloading the team.",
        "If gold matters to you, deciding when to engage is still a decision — make it an informed one.",
      ],
    },
    joinSection: {
      headline: "Join The {projectName}",
      paragraphs: [
        "**The {projectName}** is a group reserved exclusively to people who took advantage of strong opportunities in the gold market and quietly built substantial profits along the way.",
        "**{projectName} Members** enjoy retreats around the world every month while they make money on their laptop with just a few minutes of “work” every day.",
      ],
    },
    testimonialsSectionTitle: "What members say",
    testimonials: [
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
    moSection: {
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
  },
};
