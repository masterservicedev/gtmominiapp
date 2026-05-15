import type { FunnelConfig } from "@/lib/funnel/framework";

export const ad7Config: FunnelConfig = {
  id: "ad7",
  name: "Moon Group Dark Premium",
  sourceRef: "The Moon Group — VIP Trading Access lander",
  projectName: "GTMO Signals",
  primaryCtaLabel: "Apply for access",
  headerLogoSrc: "/offer/media/gtmologo.png",

  theme: {
    // Dark premium — distinct from ad4 (amber) via gold accent and different surface shades
    pageBg:           "#080808",
    pageText:         "#f0f0f0",
    surfaceBg:        "#101010",
    surfaceBorder:    "#1c1c1c",
    cardBg:           "#141414",
    cardBorder:       "#242424",
    mutedText:        "#666666",
    headingColor:     "#ffffff",
    headingFont:      '"Inter", "Helvetica Neue", sans-serif',
    bodyFont:         '"Inter", "Helvetica Neue", sans-serif',
    // Gold accent — deeper/cooler than ad4's amber
    accentBg:         "#c9a84c",
    accentBgHover:    "#b8963e",
    accentFg:         "#000000",
    accentOnLight:    "#c9a84c",
    // Band — dark gradient for urgency band section
    bandFrom:         "#0f0f0f",
    bandVia:          "#141414",
    bandTo:           "#0a0a0a",
    bandText:         "#ffffff",
    bandMuted:        "#888888",
    bandBulletBorder: "#2a2a2a",
    // Sticky bottom bar
    stickyBg:         "#080808",
    stickyBorder:     "#1c1c1c",
    // Layout
    maxWidth:         "640px",
    heroPaddingY:     "24px",
    sectionPaddingY:  "40px",
    // Marketing section CSS vars
    bodyColor:            "#aaaaaa",
    overlayBg:            "rgba(0,0,0,0.85)",
    accentContrast:       "#000000",
    headingWeight:        700,
    headingTransform:     "none",
    headingLetterSpacing: "-0.02em",
    btnRadius:            "6px",
    btnPadding:           "14px 28px",
    btnFontSize:          "15px",
    btnFontWeight:        700,
    btnTextTransform:     "none",
    cardRadius:           "10px",
    cardPadding:          "20px",
    cardShadow:           "none",
  },

  sections: [
    {
      type: "hero",
      headline: "Our traders secured over $2,000,000 — documented live.",
      subheadline: "Not a highlight reel. Not an estimate. A recorded live session with real positions, real exits, and full risk transparency.",
      video: {
        src: "https://vz-f212c83f-59e.b-cdn.net/06c8df91-48fc-4ffd-b4b7-29796abe6da8/playlist.m3u8",
        minWatchSeconds: 0,
      },
      ctaLabel: "Apply for access",
      videoAspectRatio: "4/5",
    },
    {
      type: "stats",
      items: [
        { value: "$2M+", label: "secured in a single documented live session" },
        { value: "1,150+", label: "pips called live in a single trading week" },
        { value: "10,000+", label: "traders following live sessions daily" },
      ],
    },
    {
      type: "why",
      headline: "Most traders don't fail because trading doesn't work.",
      subheadline: "They fail because they approach it without structure, without guidance, and without control.",
      body: [
        "After years operating in live markets, one pattern is consistent: the traders who lose do so not from bad luck, but from bad process. No framework for entries. No discipline on exits. No structure around risk.",
        "GTMO was built to solve exactly that. A private environment where every trade setup is explained before execution, every exit is shared in real time, and every decision is made with a clear framework — not emotion.",
        "You are not left to figure it out alone. You follow a live trader who has been executing in the gold market every day, with full transparency on what goes in and what comes out.",
      ],
      ctaLabel: "Apply for access",
    },
    {
      type: "how_it_works",
      headline: "What you get access to",
      steps: [
        {
          number: 1,
          title: "Guided trade setups",
          body: "Every entry is called live — before execution. You see the setup, the reasoning, the entry level, and the stop. Nothing is posted after the fact.",
        },
        {
          number: 2,
          title: "Structured decision-making",
          body: "No guessing. No random trades. Every decision follows a repeatable framework built around discipline, timing, and controlled execution.",
        },
        {
          number: 3,
          title: "Direct access to experienced traders",
          body: "Your specialist confirms your access path after your account is funded. They remain your point of contact as you progress.",
        },
        {
          number: 4,
          title: "Ongoing market insights",
          body: "Live sessions run every trading day. You follow the process in real time — whether you are learning deeply or following the system step by step.",
        },
      ],
    },
    {
      type: "why",
      headline: "This is not for everyone.",
      subheadline: "We are not looking for people who treat trading like gambling.",
      body: [
        "If your approach is to deposit large amounts and risk everything on a single trade, this is not the right environment. That approach leads to losses — and we do not allow it inside GTMO.",
        "We are looking for individuals who think before they act, understand that risk management is non-negotiable, and want to grow their capital over time using discipline and structure.",
        "This is how serious traders operate. If that describes you, continue to the application.",
      ],
      ctaLabel: "Apply for access",
    },
    {
      type: "testimonials_slider",
      headline: "What members say",
      layout: "slider",
      items: [
        { name: "James, London", quote: "I stopped guessing and started following a process. The difference in how I approach every trade now is completely different." },
        { name: "Miguel, Barcelona", quote: "Two months following the live sessions and I finally understand why trades are taken, not just that they were taken." },
        { name: "Sophie, Dubai", quote: "The structure removed the emotion. I follow the system and I understand it. That's what I was missing." },
        { name: "Isabella, Milan", quote: "I work long shifts and can't watch markets all day. The live sessions give me everything I need in a clear, structured format." },
      ],
    },
    {
      type: "authority_card",
      headline: "Meet Gold Trader Mo",
      name: "The trader behind GTMO Signals",
      imageSrc: "/offer/media/mo.jpg",
      body: [
        "I'm Mo — a full-time gold trader with 4+ years of live track record. The $2M+ session you watched was not a one-off. It is what structured execution looks like when the framework is correct.",
        "I built GTMO because the tools and structure that serious traders use are not available to most retail traders — unless someone builds it and runs it with full transparency. That is what this is.",
        "Every session is live. Every entry is called before execution. Every exit is shared with the community in real time.",
      ],
      signOff: ["Your trader,", "Mo"],
    },
    {
      type: "faq",
      headline: "Before you apply",
      items: [
        { question: "Is the $2M session real?", answer: "Yes. The video you watched is an unedited recording of a live trading session. Positions, entries, exits, and results are shown in real time. This is documented evidence of what structured execution can produce — it is not a guarantee of your results." },
        { question: "What does my funding go toward?", answer: "Your funding goes into your own Vantage trading account — not to GTMO. GTMO access activates as a partnership benefit after your account is funded and verified. You trade your own money." },
        { question: "How is this different from a signals service?", answer: "A signals service sends alerts. GTMO is a live environment where every setup is explained before execution. You learn the reasoning, not just the outcome. The goal is for you to understand the process, not just follow it blindly." },
        { question: "What if I have no trading experience?", answer: "The questionnaire matches you to the right access level. No experience required. Beginners follow a structured education path before moving into live signal access." },
      ],
    },
    {
      type: "cta",
      headline: "Limited intake — application required.",
      subheadline: "Not every application is accepted. Complete the short questionnaire and your specialist will confirm whether you are a fit for the current intake round.",
      ctaLabel: "Apply for access",
      disclaimer: "Trading involves risk. Past results including the documented session do not guarantee future returns. Your funding goes into your own Vantage trading account.",
    },
  ],
};
