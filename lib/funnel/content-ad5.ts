import type { FunnelVariantConfig } from "./types";

const VIDEO_SRC =
  typeof process !== "undefined"
    ? process.env.NEXT_PUBLIC_GTMO_AD5_VIDEO_URL ||
      process.env.NEXT_PUBLIC_GTMO_CODE_VIDEO_URL ||
      process.env.NEXT_PUBLIC_FUNNEL_VIDEO_URL ||
      ""
    : "";

export const ad5VariantConfig: FunnelVariantConfig = {
  theme: "emerald",
  positioningGate: {
    logoSrc: "/offer/media/gtmologo.png",
    headline: "If you're serious, move while the window is open.",
    subcopy: [
      "We keep daily onboarding measured so the team can review applications properly — not as a gimmick, as a real constraint.",
      "The next step is a short questionnaire so we can route you to the right conversation.",
      "No automation promising outcomes — just education, live context, and honest risk language.",
    ].join("\n\n"),
    ctaLabel: "Continue",
  },
  socialProofTicker: [
    "Live context in channel — process and risk framing, not price predictions",
    "Questionnaire typically under two minutes — then orderly next steps",
    "Education-first — not financial advice; no guaranteed-return language",
  ],
  offer: {
    mode: "code_landing",
    projectName: "GTMO Signals",
    headerLogoSrc: "/logo-gtmo-crown.png",
    primaryCtaLabel: "Open application",
    video: {
      src: VIDEO_SRC,
      minWatchSeconds: 0,
    },
    intro: {
      h1: "Markets move fast — your plan shouldn't be improvised in the dark.",
      h2: "Watch a short brief: how we think about structure, timing, and risk in live conditions.",
      h2b: "Then decide if you want to continue to a short application — nothing hidden behind a fake countdown.",
      h3: 'This is a live trading environment led by someone who executes in real time and explains the "why" — not a bot, not a miracle script.',
    },
    urgencyAside: {
      eyebrow: "Private intake",
      headline:
        "Complete the brief, then open your application while this intake round is active.",
      bullets: [
        "One path: watch → short questionnaire → specialist routing when it makes sense.",
        "We decline noisy or misaligned applicants on purpose — it protects the community.",
        "Nothing here promises profit — only clarity on process and what happens next.",
      ],
    },
    midPageUrgency: {
      title: "How it works",
      subtitle: "Three steps — aligned with what actually happens in the app.",
      bullets: [
        "Watch the brief above so you understand tone, risk, and how live context is shared.",
        "Answer a short questionnaire so we can match you to the right next step.",
        "If it's a fit, you'll hear from our side with orderly follow-up — not pressure spam.",
      ],
    },
    joinSection: {
      headline: "Join The {projectName}",
      paragraphs: [
        "**The {projectName}** is for traders who want live gold context, disciplined framing, and a community that prefers process over hype.",
        "**Members** who align get a clearer lane: structured updates, risk-aware discussion, and support through onboarding — not a fantasy of passive income.",
      ],
    },
    testimonialsSectionTitle: "What members say",
    testimonials: [
      {
        name: "Laura Abenstein",
        imageFile: "/offer/media/laura.jpg",
        quote:
          "The shift for me was structure — knowing what to ignore and what to focus on. The group helped me stay accountable.",
      },
      {
        name: "Chris Hadid",
        imageFile: "/offer/media/chris.jpg",
        quote:
          "Morning routine is calmer now — I finally have language for risk that matches how I actually trade.",
      },
      {
        name: "Michael Zusman",
        imageFile: "/offer/media/michael.jpg",
        quote:
          "I came for the live context and stayed for the discipline — it's consistent in a way I didn't have on my own.",
      },
      {
        name: "Magda Boltyanski",
        imageFile: "/offer/media/magda.jpg",
        quote:
          "Feels like I have a framework I can revisit when markets get loud — less guessing, more intention.",
      },
      {
        name: "Carl Edwards",
        imageFile: "/offer/media/carl.jpg",
        quote:
          "Before joining I was scattered. Having a clear path and people who take risk seriously made a real difference for me.",
      },
    ],
    moSection: {
      title: "Meet Gold Trader Mo",
      subtitleLines: ["The Genius Behind The", "GTMO Signals"],
      bodyParagraphs: [
        "Hi — I'm Mo. I'm a **full-time trader** with years of live execution in gold — not a vendor selling a black box.",
        "I built **GTMO Signals** around what I wished I had early on: live context, explicit risk talk, and a community that doesn't confuse entertainment with a trading plan.",
        "Watch the brief, then continue only if you want an education-first path and a fair review of your application.",
        "If you're looking for guaranteed outcomes or hands-off automation, this won't be a match — and that's intentional.",
      ],
      imageFile: "/offer/media/mo.jpg",
      signOffLines: ["Your Friend,", "Mo"],
    },
    disclaimerParagraphs: [
      "**Not financial advice.** Everything here is for general education. Trading and leveraged products carry substantial risk of loss; you can lose more than you deposit.",
      "**No guaranteed results.** Past or hypothetical examples are not reliable indicators of future performance. Only use capital you can afford to lose.",
      "**Eligibility and fit.** Applications are reviewed manually; meeting the questionnaire does not guarantee access, timing, or any particular product.",
      "**Your responsibility.** You are responsible for your decisions, taxes, and compliance with laws in your jurisdiction.",
    ],
  },
};
