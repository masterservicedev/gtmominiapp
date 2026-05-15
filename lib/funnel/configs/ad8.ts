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
    {
      type: "hero",
      headline: "He just made $18,000 live. The next trade goes to VIP only.",
      subheadline: "Watch the full session — positions on screen, charts visible, $18,000 secured. Then hear what Mo says about the next setup and who gets it first.",
      video: {
        src: "https://vz-f212c83f-59e.b-cdn.net/1aee49a2-3622-46b3-bffd-cb966bdaece3/playlist.m3u8",
        minWatchSeconds: 0,
      },
      ctaLabel: "I want VIP access",
    },
    {
      type: "why",
      headline: "You just watched $18,000 get made. You were not in position for it.",
      subheadline: "VIP members were. The next setup is already prepared.",
      body: [
        "Every session Mo runs, he calls the entries live — before the position opens. VIP members see the setup, understand the reasoning, and are in position before execution. Everyone else watches the result after it happens.",
        "The $18,000 session you just watched was one of those calls. The next one is already prepared. Mo will share it with VIP members in the next session.",
        "The question is whether you are going to be in position for it, or watching from outside again.",
      ],
      ctaLabel: "Apply for VIP access",
    },
    {
      type: "stats",
      items: [
        { value: "$18K", label: "secured in the live session you just watched" },
        { value: "1,150+", label: "pips called live in a single trading week" },
        { value: "10,000+", label: "members following live setups every day" },
      ],
    },
    {
      type: "how_it_works",
      headline: "How VIP access works",
      steps: [
        {
          number: 1,
          title: "Complete your application",
          body: "Answer a short questionnaire — under two minutes. We match you to the right access level based on your capital and experience.",
        },
        {
          number: 2,
          title: "Fund your trading account",
          body: "Your specialist sends a Vantage registration link. You fund your own account. Your GTMO VIP access activates after verification — your money stays in your account.",
        },
        {
          number: 3,
          title: "Get the next trade before it opens",
          body: "VIP members receive live setups before execution. Entry level, stop, target, and the reasoning behind each position — before Mo opens the trade.",
        },
      ],
      ctaLabel: "Apply for VIP access",
    },
    {
      type: "urgency",
      headline: "⚠️ This intake round closes when spots fill — no countdown, no fake timer.",
      bullets: [
        "Each intake round is capped. When the spots are gone, the next round opens at a later date.",
        "The next trade setup Mo has prepared goes to VIP members in the next session.",
        "Your application takes under two minutes.",
      ],
    },
    {
      type: "testimonials_slider",
      headline: "From inside the VIP",
      layout: "slider",
      items: [
        { name: "James, London", quote: "I watched the session from outside for weeks. The day I got VIP access, I was in position on the next call. That was the difference." },
        { name: "Miguel, Barcelona", quote: "Watching $18K get made live and knowing the next setup is already prepared — that was enough for me to apply immediately." },
        { name: "Sophie, Dubai", quote: "The live sessions show you exactly what happened and why. Being inside means you see it before it happens, not after." },
        { name: "Isabella, Milan", quote: "I applied because of a session video. Two months later I understand the setups well enough to follow them properly. The live access makes the difference." },
      ],
    },
    {
      type: "authority_card",
      headline: "Mo — the trader in the video",
      name: "Full-time gold trader. Every session live, unedited.",
      imageSrc: "/offer/media/mo.jpg",
      body: [
        "The $18,000 session you watched is standard. Not because the market always moves like that — but because the framework for finding setups like that is applied consistently, every trading day.",
        "Every entry I make is called live before I open the position. VIP members see the setup, understand the reasoning, and are in position before execution. That is what VIP access means inside GTMO.",
        "The next setup is ready. Apply if you want to be in position for it.",
      ],
      signOff: ["Mo"],
    },
    {
      type: "faq",
      headline: "Before you apply",
      items: [
        { question: "Is the $18,000 session real?", answer: "Yes. The video is an unedited recording of a live trading session with positions and charts visible throughout. It is documented evidence of what structured execution produces — not a guarantee of your results." },
        { question: "What is the 'next trade' Mo mentions?", answer: "Mo prepares setups based on his live market analysis. When a setup meets his criteria, he shares it with VIP members before opening the position. You see the entry, the stop, the target, and the reasoning — in real time." },
        { question: "Does my money go to Mo or GTMO?", answer: "No. Your funding goes into your own Vantage trading account. GTMO VIP access activates as a partnership benefit after your account is funded and verified. You trade your own capital." },
        { question: "What happens after I apply?", answer: "You complete a short questionnaire — under two minutes. A specialist confirms your access level and walks you through every step including your Vantage account setup." },
      ],
    },
    {
      type: "cta",
      headline: "The next setup goes to VIP members. Apply now.",
      subheadline: "Intake is limited. Application takes under two minutes. Your specialist follows up directly.",
      ctaLabel: "Apply for VIP access now",
      disclaimer: "Trading involves risk. The documented session is a real result and not a guarantee of what you will achieve. Past performance does not guarantee future returns. Your funding goes into your own Vantage trading account.",
    },
  ],
};
