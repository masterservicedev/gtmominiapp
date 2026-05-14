import type { FunnelVariantConfig } from "./types";
import { funnelPaletteVioletSky } from "./palette";

const VIDEO_SRC =
  typeof process !== "undefined"
    ? process.env.NEXT_PUBLIC_GTMO_AD5_VIDEO_URL ||
      process.env.NEXT_PUBLIC_GTMO_CODE_VIDEO_URL ||
      process.env.NEXT_PUBLIC_FUNNEL_VIDEO_URL ||
      ""
    : "";

export const ad5VariantConfig: FunnelVariantConfig = {
  accentPalette: funnelPaletteVioletSky,
  positioningGate: {
    logoSrc: "/offer/media/gtmologo.png",
    headline: "Attention — if you want gold context with structure, read this before you tap through.",
    subcopy: [
      "This path is for people who prefer a clear process over noise: a short on-page brief, then a questionnaire inside the app.",
      "We review applications in rounds. When a round is full, the next window may be later — that is a real operational limit, not a theatrical timer.",
      "Nothing here is a promise of profit, accuracy, or passive income. It is education, live framing, and honest risk language only.",
    ].join("\n\n"),
    ctaLabel: "Continue to the brief",
  },
  socialProofTicker: [
    "Applications are reviewed in order — the questionnaire is short and routes you cleanly",
    "Gold-focused context: how setups are discussed, how risk is named, what “live” actually means here",
    "Not financial advice — no robot claims, no celebrity endorsements, no fake market tickers",
  ],
  offer: {
    mode: "code_landing",
    projectName: "GTMO Signals",
    headerLogoSrc: "/logo-gtmo-crown.png",
    primaryCtaLabel: "Continue to questionnaire",
    video: {
      src: VIDEO_SRC,
      minWatchSeconds: 0,
    },
    intro: {
      h1: "Gold rewards patience — but patience without a plan is just waiting.",
      h2: "Start with a calm brief: how we organize ideas before price does anything dramatic.",
      h2b: "Then you choose whether to continue — no countdown theatre, no third-party widgets pretending to be “live markets.”",
      h3: "You are not buying a script. You are seeing whether an education-first community and live context match how you want to learn.",
    },
    urgencyAside: {
      eyebrow: "While this intake window is open",
      headline:
        "If this is the right moment for you, complete the brief and move to the in-app questionnaire in one straight line.",
      bullets: [
        "Watch the brief so tone, risk, and cadence make sense before you answer anything.",
        "The questionnaire is there to route you properly — not to pressure you into a deposit story.",
        "We decline applicants who need hype or guarantees; that keeps the room focused on process.",
      ],
    },
    joinSection: {
      headline: "Why traders open the door to {projectName}",
      paragraphs: [
        "**{projectName}** is built around gold, live discussion, and a shared vocabulary for risk — not around get-rich shortcuts or hidden “levels.”",
        "**People who stay** tend to want the same things: clearer prep before sessions, less improvisation under stress, and a place where outcomes are not marketed as inevitable.",
      ],
    },
    midPageUrgency: {
      title: "How it works (in plain steps)",
      subtitle:
        "Same flow every time — so you always know what you are agreeing to before anything formal.",
      bullets: [
        "Step one: use the brief above to understand how context is shared and how limits are talked about.",
        "Step two: answer the short questionnaire in the app so we can match you to the right next conversation.",
        "Step three: if there is a fit, you hear from us in an orderly way. If not, you still leave with a clear boundary — no spam ladder.",
      ],
    },
    testimonialsSectionTitle: "Voices from the community",
    testimonials: [
      {
        name: "Laura Abenstein",
        imageFile: "/offer/media/laura.jpg",
        quote:
          "I was tired of feeds that yell. Here the tone is slower and the risk talk matches how I actually think about size.",
      },
      {
        name: "Chris Hadid",
        imageFile: "/offer/media/chris.jpg",
        quote:
          "Mornings feel less chaotic — I have a checklist for what I ignore and what I actually prepare for.",
      },
      {
        name: "Michael Zusman",
        imageFile: "/offer/media/michael.jpg",
        quote:
          "I stayed because the framing is consistent. I am not promised outcomes — I am shown process.",
      },
      {
        name: "Magda Boltyanski",
        imageFile: "/offer/media/magda.jpg",
        quote:
          "When volatility spikes I have language for it now instead of reacting in a panic loop.",
      },
      {
        name: "Carl Edwards",
        imageFile: "/offer/media/carl.jpg",
        quote:
          "I came scattered. Having a single lane for how information is delivered helped more than any single “tip.”",
      },
    ],
    moSection: {
      title: "Meet Gold Trader Mo",
      subtitleLines: ["Behind the daily", "GTMO Signals"],
      bodyParagraphs: [
        "Hi — I am Mo. I trade gold in live conditions and prefer showing reasoning over selling mystery.",
        "**GTMO Signals** exists because I wanted a room that treats leverage seriously: where stops and context are normal topics, not afterthoughts.",
        "If you want a polished story about effortless wins, you will not find it here. If you want structure and a fair review of fit, watch the brief and continue only when that still sounds right.",
        "Applications are filtered on purpose. The goal is a serious table — not the widest possible audience.",
      ],
      imageFile: "/offer/media/mo.jpg",
      signOffLines: ["With respect,", "Mo"],
    },
    disclaimerParagraphs: [
      "**Is this financial advice?** No. Nothing on this page tells you what to buy or sell. It is general education and orientation only.",
      "**Will I make money?** Markets can move against you quickly. You can lose some or all of your capital, including more than you deposit when leverage is involved. Past examples are not reliable guides to your future.",
      "**Who is this for?** Adults who can read risk disclosures and who want an education-first path. It is not for anyone seeking guaranteed returns, “AI accuracy,” or hands-off automation.",
      "**What happens after the questionnaire?** If there is a match, next steps are explained clearly. If not, you should expect a clean stop — not an endless upsell chain.",
      "**Regulatory note.** You are responsible for your decisions and for rules that apply where you live. We do not claim celebrity partnerships or third-party endorsements that do not exist.",
      "**Still unsure?** Do not continue. Close the page, sleep on it, and come back only if slow process still sounds better than another loud funnel.",
    ],
  },
};
