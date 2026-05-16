import type { FunnelConfig } from "@/lib/funnel/framework";

export const ad9Config: FunnelConfig = {
  id: "ad9",
  name: "Gems Uncovered Editorial",
  sourceRef: "Gems Uncovered / Tan Gera DeFi newsletter long-form lander",
  projectName: "GTMO Signals",
  primaryCtaLabel: "Apply for access",
  headerLogoSrc: "/offer/media/gtmologo.png",

  theme: {
    // Warm cream editorial — unique in rotation (only serif heading font)
    // Distinct from: ad6 white/yellow, ad8 white/purple, all dark variants
    pageBg:           "#fefcf7",
    pageText:         "#1c1c1c",
    surfaceBg:        "#f7f4ed",
    surfaceBorder:    "#e8e3d8",
    cardBg:           "#fefcf7",
    cardBorder:       "#e8e3d8",
    mutedText:        "#7a7060",
    headingColor:     "#1c1c1c",
    // Serif heading font — editorial credibility, matches newsletter style
    headingFont:      '"Georgia", "Times New Roman", serif',
    bodyFont:         '"Inter", "Helvetica Neue", sans-serif',
    // Forest green accent — wealth, trust, finance
    accentBg:         "#2c5f2e",
    accentBgHover:    "#1e4a20",
    accentFg:         "#ffffff",
    accentOnLight:    "#2c5f2e",
    // Band — dark green for urgency band
    bandFrom:         "#1a3d1c",
    bandVia:          "#2c5f2e",
    bandTo:           "#1a3d1c",
    bandText:         "#ffffff",
    bandMuted:        "#a8d4a8",
    bandBulletBorder: "#3d7a40",
    // Sticky bar — warm white
    stickyBg:         "#fefcf7",
    stickyBorder:     "#e8e3d8",
    // Layout
    maxWidth:         "640px",
    heroPaddingY:     "24px",
    sectionPaddingY:  "36px",
    // Marketing section CSS vars
    bodyColor:            "#4a4540",
    overlayBg:            "rgba(26,61,28,0.94)",
    accentContrast:       "#ffffff",
    headingWeight:        700,
    headingTransform:     "none",
    headingLetterSpacing: "-0.01em",
    btnRadius:            "4px",
    btnPadding:           "14px 28px",
    btnFontSize:          "15px",
    btnFontWeight:        600,
    btnTextTransform:     "none",
    cardRadius:           "6px",
    cardPadding:          "20px",
    cardShadow:           "0 1px 4px rgba(0,0,0,0.06)",
  },

  sections: [
    // ── Hero ──────────────────────────────────────────────────────────────
    {
      type: "hero",
      headline: "Discover The Live Trade Setups Some Gold Traders Are Using To Operate With Clarity — While Everyone Else Guesses.",
      subheadline: "From The Desk Of Mo — Full-Time Gold Trader, 4+ Years Live Track Record.",
      video: {
        src: "https://vz-f212c83f-59e.b-cdn.net/5fefcd3a-dee9-494f-b2ac-4edeb093fb63/playlist.m3u8",
        minWatchSeconds: 0,
      },
      ctaLabel: "Apply for access",
    },

    // ── Opening question ───────────────────────────────────────────────────
    {
      type: "why",
      headline: "Let me ask you something.",
      body: [
        "You are interested in gold trading — or you would not be reading this.",
        "But you might feel a bit lost in the noise. The signals groups, the Telegram channels, the endless YouTube charts. You can see the opportunity is real. Yet finding a clear, structured path into it feels impossible.",
        "If that resonates — you are not alone.",
        "Most people who want to trade gold seriously are trapped between two bad options: go it alone with no guidance, or follow anonymous signal groups that post alerts after the position is already moving.",
        "Neither works. And you already know that.",
        "By the time you finish reading this, you will understand exactly why — and what is actually available to you instead.",
      ],
    },

    // ── Authority ──────────────────────────────────────────────────────────
    {
      type: "authority_card",
      headline: "My name is Mo.",
      name: "Full-time gold trader. Every session live and unedited.",
      imageSrc: "/offer/media/mo.jpg",
      body: [
        "I have been operating in the XAU/USD market every trading day for over four years. Not posting analysis after the fact. Not running a signals channel that pushes alerts without context. Actually trading — with real capital, in real time, in front of the people inside GTMO.",
        "Every entry I make is called live before the position opens. Every stop is explained. Every exit is shared with the community as it happens. The session in the video above is exactly what that looks like on a normal day.",
        "I built GTMO because I was frustrated by what was available to retail traders. Either pay thousands for a course that teaches theory, or follow anonymous signals with no explanation of why a trade is being taken. There was no middle option — a live environment where the reasoning was shown, not just the result.",
        "That is what GTMO is. And that is what I am offering you access to today.",
      ],
      signOff: ["Mo"],
    },

    // ── The insight: the access gap ────────────────────────────────────────
    {
      type: "why",
      headline: "Here is the truth about why most traders lose.",
      subheadline: "It is not their intelligence. It is not their capital. It is not their timing.",
      body: [
        "It is access.",
        "Every serious trader who operates consistently has one thing the average person does not: they know the setup before it is public. They see the entry level, the reasoning, the structure of the trade — before it moves. Everyone else is reacting to what already happened.",
        "Think about what you are consuming right now when you look at trading content. YouTube videos posted after the trade closed. Twitter calls made when the position is already running. Signals delivered after the entry has passed.",
        "That is not access. That is a highlight reel.",
        "Real access means you are inside the environment when the setup is being called. You understand why the entry level matters. You know where the stop is and why it is there. You are positioned before execution — not scrambling after.",
        "That is the gap. And it is the only thing that separates the traders operating with clarity from the ones constantly a step behind.",
      ],
    },

    // ── What GTMO actually provides ────────────────────────────────────────
    {
      type: "how_it_works",
      headline: "What GTMO gives you that nothing else does.",
      steps: [
        {
          number: 1,
          title: "Live setups called before execution",
          body: "Every trade setup is shared before Mo opens the position. Entry level, stop, target, and the full reasoning behind it — in real time, every trading day. Not after the fact. Not in retrospect.",
        },
        {
          number: 2,
          title: "The context behind every trade",
          body: "A signal without context is worthless. Inside GTMO, every setup includes the market structure analysis, the logic of the entry, and the risk framework. You understand what is happening and why — not just what number to buy at.",
        },
        {
          number: 3,
          title: "A specialist who activates your access",
          body: "When you apply and are accepted, a specialist contacts you directly. They confirm your access level, send your registration link, and walk you through every step. You are not left to figure it out alone.",
        },
        {
          number: 4,
          title: "An environment that filters for seriousness",
          body: "Not every application is accepted. GTMO is not a public signals group. We limit intake deliberately — because the quality of the environment depends on the quality of the people inside it.",
        },
      ],
    },

    // ── Stats ──────────────────────────────────────────────────────────────
    {
      type: "stats",
      items: [
        { value: "1,150+", label: "pips called live in a single trading week — setups explained before execution" },
        { value: "$35K+", label: "secured in a single live NFP session — documented, unedited" },
        { value: "10,000+", label: "members inside the environment following live setups every day" },
      ],
    },

    // ── What this is not ───────────────────────────────────────────────────
    {
      type: "why",
      headline: "What GTMO is not.",
      body: [
        "It is not a generic signals group. Most signals groups post alerts after the position is already moving. GTMO calls setups before execution, with full context.",
        "It is not a course. You are not buying videos to watch alone. You are entering a live environment where a real trader operates in front of you every trading day.",
        "It is not financial advice. Nothing inside GTMO constitutes advice. Mo shares what he is doing and why. What you do with that information is your decision.",
        "It is not for everyone. If your approach to trading is to deposit large capital and risk it on a single move — this is not the right environment. That approach leads to losses, and we do not allow it inside GTMO.",
        "What it is: access to a live trading environment built around structure, discipline, and transparency. The kind of access that was previously unavailable to most retail traders.",
      ],
    },

    // ── Three choices ──────────────────────────────────────────────────────
    {
      type: "why",
      headline: "You have three options from here.",
      body: [
        "Option one: do nothing. If you are confident your current approach to the markets is producing consistent results, and you do not feel a step behind — this is not for you. Move on, and I genuinely wish you well.",
        "Option two: go it alone. You can continue consuming free content, following anonymous signals, and trying to piece together a framework from YouTube videos. This is how most people approach it. It is also why most people are still in the same position twelve months later.",
        "Option three: apply for access. Let a trader who has been operating live in this market every day for four years show you the setups before they open. Follow the process in real time. Build the framework from inside an environment where everything is transparent.",
        "The application takes under two minutes. A specialist follows up directly.",
      ],
    },

    // ── Testimonials ───────────────────────────────────────────────────────
    {
      type: "testimonials_slider",
      headline: "From people already inside.",
      layout: "slider",
      items: [
        { name: "James, London", quote: "I spent months consuming free content and getting nowhere. Six weeks inside GTMO and I finally understand what a real setup looks like before it moves." },
        { name: "Miguel, Barcelona", quote: "The difference between a signals group and this is night and day. I know why every trade is taken — not just that it was taken." },
        { name: "Sophie, Dubai", quote: "I had tried two other communities before this. Neither of them called entries live before execution. That one thing changes everything." },
        { name: "Isabella, Milan", quote: "The context Mo provides on every setup is what I was missing. I am not just following — I am understanding. That is what I needed." },
      ],
    },

    // ── Final push ─────────────────────────────────────────────────────────
    {
      type: "why",
      headline: "Most people will read this and do nothing.",
      body: [
        "Not because they cannot afford to apply. Not because they do not want access to live trade setups. Not because they do not understand what is being offered.",
        "Because they are waiting. Waiting for a better time. Waiting for more certainty. Waiting for something that makes the decision feel easier.",
        "But here is what does not wait: the market. The setups Mo is calling right now are going to VIP members. The next intake round will open when it opens — and close when the spots fill.",
        "If you have read this far, you already know whether this is for you. The application takes under two minutes. A specialist confirms your access. Everything else follows from there.",
        "You are one step from being inside the environment instead of outside it.",
      ],
    },
  ],
};
