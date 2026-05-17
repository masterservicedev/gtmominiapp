import type { FunnelConfig } from "@/lib/funnel/framework";

export const ad8Config: FunnelConfig = {
  id: "ad8",
  name: "Bitcoin UP Purple",
  sourceRef: "Bitcoin UP lander — bitcoinup.io style",
  projectName: "GTMO Signals",
  primaryCtaLabel: "Apply for VIP access",
  headerLogoSrc: "/offer/media/gtmologo.png",

  theme: {
    // Light body, purple accent — extracted from Bitcoin UP #7b3dbb FAQ headings
    // Distinct from ad4 (amber/dark), ad6 (yellow/light), ad7 (gold/dark)
    pageBg:           "#ffffff",
    pageText:         "#1a1a1a",
    surfaceBg:        "#f7f7f7",
    surfaceBorder:    "#e0e0e0",
    cardBg:           "#ffffff",
    cardBorder:       "#e0e0e0",
    mutedText:        "#777777",
    headingColor:     "#1a1a1a",
    headingFont:      '"Arial", "Helvetica Neue", sans-serif',
    bodyFont:         '"Arial", "Helvetica Neue", sans-serif',
    // Purple accent — from Bitcoin UP #7b3dbb
    accentBg:         "#7b3dbb",
    accentBgHover:    "#6a32a0",
    accentFg:         "#ffffff",
    accentOnLight:    "#7b3dbb",
    // Band — dark purple gradient for urgency section
    bandFrom:         "#2d1654",
    bandVia:          "#3d1f6e",
    bandTo:           "#2d1654",
    bandText:         "#ffffff",
    bandMuted:        "#c8a8f0",
    bandBulletBorder: "#5a2d9e",
    // Sticky bottom bar — white like Bitcoin UP
    stickyBg:         "#ffffff",
    stickyBorder:     "#e0e0e0",
    // Layout
    maxWidth:         "640px",
    heroPaddingY:     "24px",
    sectionPaddingY:  "40px",
    // Marketing section CSS vars
    bodyColor:            "#555555",
    overlayBg:            "rgba(45,22,84,0.92)",
    accentContrast:       "#ffffff",
    headingWeight:        700,
    headingTransform:     "none",
    headingLetterSpacing: "-0.01em",
    btnRadius:            "4px",
    btnPadding:           "14px 28px",
    btnFontSize:          "16px",
    btnFontWeight:        700,
    btnTextTransform:     "uppercase",
    cardRadius:           "8px",
    cardPadding:          "20px",
    cardShadow:           "0 2px 8px rgba(0,0,0,0.08)",
  },

  sections: [
    // ── Hero ──────────────────────────────────────────────────────────────
    {
      type: "hero",
      headline: "$18,000 made live. You were not in position for it.",
      subheadline: "Watch the full session — positions on screen, charts visible throughout, $18,000 secured. Then hear what Mo says about what comes next for the people inside.",
      video: {
        src: "https://vz-f212c83f-59e.b-cdn.net/1aee49a2-3622-46b3-bffd-cb966bdaece3/playlist.m3u8",
        minWatchSeconds: 0,
      },
    },

    // ── Opening FOMO ──────────────────────────────────────────────────────
    {
      type: "why",
      headline: "Every person inside GTMO had a session they first watched from the outside.",
      subheadline: "The only difference between watching and being positioned is whether you applied.",
      body: [
        "Every setup Mo calls is shared live — before the position opens. Entry level, stop, target, and the reasoning behind it. In real time. Before execution.",
        "The $18,000 session you just watched was not unusual. It is what a structured live environment produces when the framework is applied consistently. The people inside saw the setup before it opened. Everyone else saw the result after it closed.",
        "After you complete the short questionnaire, you will be matched to the access level that fits your capital and experience. Some will qualify for VIP signal access — live setups called directly before Mo opens the position. Others will be matched to a structured education path that builds toward that.",
        "Either way, you stop watching from the outside.",
      ],
    },

    // ── Stats ──────────────────────────────────────────────────────────────
    {
      type: "stats",
      items: [
        { value: "$18K", label: "secured live in the session you just watched — positions visible throughout" },
        { value: "1,150+", label: "pips called live before execution in a single trading week" },
        { value: "10,000+", label: "members inside the environment across all access levels" },
      ],
    },

    // ── Access matching ────────────────────────────────────────────────────
    {
      type: "why",
      headline: "Your access level is matched to your capital and experience.",
      subheadline: "Not everyone qualifies for VIP. Everyone qualifies for something that moves them closer to it.",
      body: [
        "VIP access means live setups called directly before Mo opens the position. Entry, stop, target, reasoning — before execution. This is the level that the $18,000 session represents.",
        "For traders with smaller starting capital, GTMO offers structured access paths that build the framework and education needed to operate at that level. Live sessions are still part of the environment. The depth of signal access increases with your account level.",
        "The questionnaire takes under two minutes. It tells your specialist exactly where to start you. They confirm your path and activate your access after your account is funded and verified.",
        "Your funding goes into your own trading account — not to GTMO. Access activates as a partnership benefit.",
      ],
    },

    // ── How it works ──────────────────────────────────────────────────────
    {
      type: "how_it_works",
      headline: "How access works.",
      steps: [
        {
          number: 1,
          title: "Complete the questionnaire",
          body: "Under two minutes. Capital level, experience, readiness. Your answers determine your matched access path — VIP signal access or a structured education path that builds toward it.",
        },
        {
          number: 2,
          title: "A specialist confirms your path",
          body: "Your specialist contacts you directly. They confirm your access level, send your registration link, and walk you through every step. You are not left to figure it out alone.",
        },
        {
          number: 3,
          title: "Fund your account — access activates",
          body: "Your funding goes into your own trading account. GTMO VIP access activates as a partnership benefit after verification. From there, you are inside — not watching from outside.",
        },
      ],
    },

    // ── Urgency ────────────────────────────────────────────────────────────
    {
      type: "urgency",
      headline: "⚠️ This intake round closes when spots fill.",
      bullets: [
        "No countdown timer. No fake scarcity. Each round is capped and when spots fill, the next round opens at a later date.",
        "The next live session goes to members inside the environment. The application takes under two minutes.",
        "Every week you are outside is a week of setups you are watching after they close.",
      ],
    },

    // ── Testimonials ───────────────────────────────────────────────────────
    {
      type: "testimonials_slider",
      headline: "From inside the environment.",
      layout: "slider",
      items: [
        { name: "James, London", quote: "I watched sessions from outside for weeks. The day I got matched and my access activated, I was inside for the next call. That was the difference — nothing else changed." },
        { name: "Miguel, Barcelona", quote: "I started on an education path because my capital was smaller. Within months I understood the framework well enough to follow VIP setups. The structure is what got me there." },
        { name: "Sophie, Dubai", quote: "The questionnaire matched me correctly. My specialist knew exactly where to start me. I was not oversold VIP when what I needed was the education foundation first." },
        { name: "Isabella, Milan", quote: "The $18K session video was what made me apply. Two months later I understand why every position in that session was taken. Being inside changes how you see every setup." },
      ],
    },

    // ── Authority ──────────────────────────────────────────────────────────
    {
      type: "authority_card",
      headline: "Mo — the trader in the session you watched.",
      name: "Full-time gold trader. Every session called live, before execution.",
      imageSrc: "/offer/media/mo.jpg",
      body: [
        "The $18,000 session is what the live environment produces when the framework is applied. It is not the exception — it is what consistent, structured execution looks like.",
        "Every entry I make is called before I open the position. Entry level, stop, target, reasoning — all shared in real time with the people inside. VIP members get direct setup access. Everyone inside gets live context on every session.",
        "I built GTMO because retail traders deserve the same live transparency that institutional desks take for granted. The questionnaire tells us where to start you. Your specialist handles everything from there.",
      ],
      signOff: ["Mo"],
    },

    // ── FAQ ────────────────────────────────────────────────────────────────
    {
      type: "faq",
      headline: "Before you apply.",
      items: [
        {
          question: "What if I don't qualify for VIP?",
          answer: "VIP is the highest access level — live setups called directly before Mo opens positions. If your capital or experience level matches a lower tier, your specialist will confirm a structured path that builds toward VIP. All levels include live session access. The depth of signal access increases as your account grows.",
        },
        {
          question: "Is the $18,000 session real?",
          answer: "Yes. It is an unedited recording of a live trading session with positions and charts visible throughout. It is documented evidence of what structured execution produces — not a guarantee of your results.",
        },
        {
          question: "Does my money go to Mo or GTMO?",
          answer: "No. Your funding goes into your own trading account. GTMO access activates as a partnership benefit after your account is funded and verified. You trade your own capital.",
        },
        {
          question: "What happens after I apply?",
          answer: "You complete the questionnaire — under two minutes. A specialist contacts you to confirm your matched access level and walks you through every step, including your registration link and account setup.",
        },
      ],
    },

    // ── CTA ────────────────────────────────────────────────────────────────
    {
      type: "cta",
      headline: "Stop watching from the outside.",
      subheadline: "The questionnaire takes under two minutes. Your specialist confirms your access level and handles everything from there.",
      disclaimer: "Trading involves risk. The documented session is a real result and not a guarantee of what you will achieve. Past performance does not guarantee future returns. Your funding goes into your own trading account.",
    },
  ],
};
