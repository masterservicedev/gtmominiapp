import type { FunnelConfig } from "@/lib/funnel/framework";

export const ad6Config: FunnelConfig = {
  id: "ad6",
  name: "Fortiora Corporate",
  sourceRef: "Fortiora Advisory — fortiora.html",
  projectName: "GTMO Signals",
  primaryCtaLabel: "Apply for access",
  headerLogoSrc: "/offer/media/gtmologo.png",

  theme: {
    pageBg:           "#ffffff",
    pageText:         "#0f172a",
    surfaceBg:        "#f9fafb",
    surfaceBorder:    "#e5e7eb",
    cardBg:           "#ffffff",
    cardBorder:       "#e5e7eb",
    mutedText:        "#6b7280",
    headingColor:     "#0f172a",
    headingFont:      '"Inter", "Helvetica Neue", sans-serif',
    bodyFont:         '"Inter", "Helvetica Neue", sans-serif',
    accentBg:         "#f5c518",
    accentBgHover:    "#e6b800",
    accentFg:         "#0f172a",
    accentOnLight:    "#b45309",
    bandFrom:         "#f9fafb",
    bandVia:          "#f3f4f6",
    bandTo:           "#e5e7eb",
    bandText:         "#0f172a",
    bandMuted:        "#6b7280",
    bandBulletBorder: "#d1d5db",
    stickyBg:         "#ffffff",
    stickyBorder:     "#e5e7eb",
    maxWidth:         "640px",
    heroPaddingY:     "28px",
    sectionPaddingY:  "44px",
    bodyColor:            "#374151",
    overlayBg:            "rgba(17,24,39,0.92)",
    accentContrast:       "#0f172a",
    headingWeight:        700,
    headingTransform:     "none",
    headingLetterSpacing: "-0.02em",
    btnRadius:            "8px",
    btnPadding:           "14px 28px",
    btnFontSize:          "15px",
    btnFontWeight:        600,
    btnTextTransform:     "none",
    cardRadius:           "12px",
    cardPadding:          "20px",
    cardShadow:           "0 1px 3px rgba(0,0,0,0.08)",
  },

  sections: [
    // ── Hero ──────────────────────────────────────────────────────────────
    // Gate ended with "You already know the market works. The question is
    // whether your approach to it does." — hero picks up that thread.
    {
      type: "hero",
      headline: "The market is not the problem. The process is.",
      subheadline: "Most traders who lose in gold do not lose because the market does not work. They lose because their framework does not. This is what a structured approach looks like.",
      video: {
        src: process.env.NEXT_PUBLIC_FUNNEL_VIDEO_URL ?? "",
        minWatchSeconds: 0,
      },
      ctaLabel: "Apply for access",
    },

    // ── Opening problem expansion ──────────────────────────────────────────
    {
      type: "why",
      headline: "Here is what almost nobody tells you about consistent trading.",
      body: [
        "It is not about finding better signals. It is not about watching more analysis. It is not about having more capital or more experience.",
        "The traders who operate consistently in gold have one thing that almost everyone else does not: they see the setup before the position opens. They understand the entry level, the stop, the reasoning — before execution. Everyone else is reacting to what already happened.",
        "That is the entire gap. And it is the gap that explains why two traders can watch the same market and produce completely different results from it.",
        "One is positioned. One is chasing. The market did not treat them differently. Their process did.",
      ],
    },

    // ── Authority with proof ───────────────────────────────────────────────
    {
      type: "authority_card",
      headline: "My name is Mo. Let me show you what that gap looks like in practice.",
      name: "Full-time gold trader. 4+ years live track record.",
      imageSrc: "/offer/media/mo.jpg",
      body: [
        "I have been operating in the XAU/USD market every trading day for over four years. Every setup I take is called live — before the position opens. The entry level, the stop, the target, and the reasoning behind it are shared with GTMO members in real time.",
        "Last week: 1,150+ pips called live across the week's sessions. Every setup explained before execution.",
        "NFP session: $35,000 secured. Positions shared in real time, from entry to exit.",
        "The $2M withdrawal you may have seen elsewhere: documented live, unedited, on camera. The accumulation of consistent structured execution over time — using the same framework shared inside GTMO every day.",
        "I built this environment because there was nothing like it available to retail traders. Either expensive courses that teach theory, or signals groups that post alerts after the move has started. No live environment where the reasoning was shown before execution.",
        "That is what GTMO is. And that is what I am offering you access to today.",
      ],
      signOff: ["Your trader,", "Mo"],
    },

    // ── Stats ──────────────────────────────────────────────────────────────
    {
      type: "stats",
      items: [
        { value: "1,150+", label: "pips called live before execution in a single trading week" },
        { value: "$35,000+", label: "secured in a single NFP session — positions shown in real time" },
        { value: "10,000+", label: "members inside the environment following live setups every day" },
      ],
    },

    // ── The insight: what structure actually means ─────────────────────────
    {
      type: "why",
      headline: "Structure is not a trading style. It is the difference between a repeatable process and a series of guesses.",
      subheadline: "Most people think they have a process. Most people are guessing with extra steps.",
      body: [
        "A real process has an entry framework — specific conditions that must be met before a position is opened. Not a feeling. Not a pattern that looks familiar. Conditions.",
        "A real process has a stop logic — a defined level where the trade is wrong, placed before the position opens, and not moved because the trade is going against you.",
        "A real process has an exit structure — a target or a trailing approach that is defined before execution, not decided in the moment when emotion is highest.",
        "Most retail traders have none of these consistently. They have opinions about the market dressed up as analysis. And when the result is inconsistent, they blame the signal, the timeframe, the broker — not the process.",
        "Inside GTMO, the process is shown in real time on every trade. You do not just see what is being bought or sold. You see why, at what level, with what stop, and with what target. That is what builds a repeatable framework — and it is the only thing that does.",
      ],
    },

    // ── How it works ──────────────────────────────────────────────────────
    {
      type: "how_it_works",
      headline: "How access works — three steps.",
      steps: [
        {
          number: 1,
          title: "Complete your application",
          body: "A short questionnaire — under two minutes. We match you to the right access level based on your capital and experience. Not every application is accepted.",
        },
        {
          number: 2,
          title: "Fund your trading account",
          body: "Your specialist sends a registration link. Your funding goes into your own trading account — not to us. GTMO access activates as a partnership benefit after verification.",
        },
        {
          number: 3,
          title: "Follow live setups before execution",
          body: "Every session Mo runs, the setup is called before the position opens. Entry, stop, target, reasoning — in real time. You follow the process, understand it, and build something repeatable.",
        },
      ],
    },

    // ── Why now ───────────────────────────────────────────────────────────
    {
      type: "why",
      headline: "Why the process matters more right now than it has in years.",
      body: [
        "When conditions are clean and trending, even poorly structured trades can work. Gaps in process get covered by momentum. Most traders think they have a framework — they just have a bull market.",
        "When conditions become more complex — larger swings, faster reversals, sessions where the obvious move is wrong — the gap between a structured process and a series of guesses becomes extreme.",
        "Gold right now is in a phase where structure separates results from losses. The traders who entered positions with clear frameworks have been protected. The traders who entered on feel have been caught on the wrong side of fast reversals.",
        "Being inside a live environment where every decision is explained before execution is not a luxury in conditions like this. It is the difference between understanding what is happening and being confused by it.",
      ],
    },

    // ── Testimonials ───────────────────────────────────────────────────────
    {
      type: "testimonials_slider",
      headline: "From inside the environment.",
      layout: "slider",
      items: [
        { name: "Felix, 38", quote: "I thought I had a process. Watching Mo call entries live showed me that what I had was a series of guesses with extra steps. The difference is night and day." },
        { name: "Henrik, 29", quote: "I had never traded before. The questionnaire matched me to the right level and within weeks I understood why trades were being taken — not just that they were taken." },
        { name: "Karla, 45", quote: "I had tried signals groups. They post after the move. Being inside a live environment where the setup is called before execution is something completely different." },
        { name: "Josefa, 34", quote: "The structure changed how I think about every position. I now have a framework. Before GTMO, I had opinions about the market." },
      ],
    },

    // ── Three choices ──────────────────────────────────────────────────────
    {
      type: "why",
      headline: "Three options from here.",
      body: [
        "Option one: do nothing. If your current approach to gold is producing consistent results you are satisfied with — this is not for you. No argument from me.",
        "Option two: go it alone. Keep consuming analysis after the fact, following signals that arrive after the position is moving, building a process from disconnected information. Some people make this work. Most do not.",
        "Option three: apply for access. Follow a live trader who calls every setup before execution. Build a repeatable framework from inside an environment where every decision is explained in real time. A specialist handles every step of your onboarding.",
        "The application takes under two minutes. The sessions are running right now.",
      ],
    },

    // ── FAQ ───────────────────────────────────────────────────────────────
    {
      type: "faq",
      headline: "Before you apply.",
      items: [
        { question: "Is this a signals group?", answer: "No. A signals group sends alerts — usually after the position is already moving. GTMO is a live environment where every setup is called before Mo opens the position. Entry, stop, target, and reasoning — before execution. The goal is for you to understand the process, not just follow alerts blindly." },
        { question: "What does my funding go toward?", answer: "Your funding goes into your own trading account — not to GTMO. GTMO access activates as a partnership benefit after your account is funded and verified. You trade your own capital." },
        { question: "Do I need trading experience?", answer: "No. The questionnaire matches you to the right access level. Beginners follow a structured education path alongside live sessions. Experienced traders get direct VIP signal access. The framework is explained at every level." },
        { question: "What results can I expect?", answer: "We do not promise results. We provide a live structured environment — entry frameworks, stop logic, exit structure — explained in real time on every trade. What you produce with that depends on your capital, your discipline, and market conditions." },
      ],
    },

    // ── CTA ───────────────────────────────────────────────────────────────
    {
      type: "cta",
      headline: "The process is running live right now.",
      subheadline: "Apply in under two minutes. Your specialist confirms your access level and handles every step from there.",
      ctaLabel: "Apply for access",
      disclaimer: "Trading involves risk. Past results do not guarantee future returns. Your funding goes into your own trading account.",
    },
  ],
};
