import type { FunnelVariantConfig } from "./types";

const VIDEO_SRC =
  typeof process !== "undefined"
    ? process.env.NEXT_PUBLIC_GTMO_CODE_VIDEO_URL ||
      process.env.NEXT_PUBLIC_FUNNEL_VIDEO_URL ||
      ""
    : "";

export const ad4VariantConfig: FunnelVariantConfig = {
  theme: "amber",
  positioningGate: {
    /** Step 1 gate only — offer page header keeps `headerLogoSrc` (crown). */
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
          "I’ve been a member of the {projectName} for only 47 days. But my life has already changed! Not only have I made my first $100K, but I’ve also met some of the most incredible people in the process. Thanks, Mo!",
      },
      {
        name: "Joey Feldman",
        imageFile: "/offer/media/joey.jpg",
        quote:
          "When I joined The {projectName} 2 months ago, never could have I ever imagined the series of events that would unfold just days after locking in my free system. I was able to clear my $131,382 debt. There is no greater feeling than to be debt-free. Now, I’m in the process of buying my dream home. I still can’t believe this is all really happening…I’m forever grateful to Mo.",
      },
      {
        name: "Michael Zusman",
        imageFile: "/offer/media/michael.jpg",
        quote:
          "The results of the system speak for themselves...just as promised, I made over $13,000 every single day. Do I really need to say more?",
      },
      {
        name: "Paulo Fonzi",
        imageFile: "/offer/media/paulo.jpg",
        quote:
          "Yesterday, I QUIT my job...and today, I’m at a pool party in Vegas! Life is CRAZYYYY. And it’s all thanks to the {projectName}. THANK YOU MO!",
      },
      {
        name: "Lewis H.",
        imageFile: "/offer/media/lewis.jpg",
        quote:
          "Is this for real? I just joined 2 days ago, and my account balance has already ballooned to a staggering $27,484.98!!!",
      },
      {
        name: "Chris Hadid",
        imageFile: "/offer/media/chris.jpg",
        quote:
          "I ask my wife to pinch me every morning when I wake up and check my bank balance. I have never seen a number that big before in MY bank account. And it just continues to grow and grow some more...this is what I’ve been waiting for my entire life. Now that I have a taste of what it really feels like to be my own boss and make tens of thousands of dollars every week, I won’t ever look back!",
      },
      {
        name: "Daniel Pelts",
        imageFile: "/offer/media/daniel.jpg",
        quote:
          "Surprisingly, I used to be an investor on Wall Street. And I’ve never seen anything like this in my 10 year tenure at the company. My colleagues all thought I was crazy when I quit the firm to invest with the {projectName} system full-time. $384,594 in profits later, all of my colleagues are now BEGGING me to let them in.",
      },
      {
        name: "Magda Boltyanski",
        imageFile: "/offer/media/magda.jpg",
        quote:
          "I finally know what it’s like to live the dream. I no longer feel like I’m on the outside looking in while everyone else has all the fun. The {projectName} has allowed me to retire early and live the 1% lifestyle.",
      },
      {
        name: "Carl Edwards",
        imageFile: "/offer/media/carl.jpg",
        quote:
          "Two weeks ago, I got laid off. With no options left, I thought my life was over. Now I’m making over $13,261.42 each and every day. And for the first time in 2 months, my account isn’t overdrawn. Thank you, Mo!",
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
