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
      headline: "$2,000,000 cashed out — recorded live, unedited.",
      subheadline: "This is not a screenshot. Not a claim. Watch Mo withdraw $2M+ from a live account in real time — then decide if you want to understand how.",
      video: {
        src: "https://vz-f212c83f-59e.b-cdn.net/06c8df91-48fc-4ffd-b4b7-29796abe6da8/playlist.m3u8",
        minWatchSeconds: 0,
      },
      videoAspectRatio: "4/5",
    },
    {
      type: "stats",
      items: [
        { value: "$2M+", label: "withdrawn live on camera — full proof, no edits" },
        { value: "1,150+", label: "pips called live in a single trading week" },
        { value: "10,000+", label: "people already inside this environment" },
      ],
    },
    {
      type: "why",
      headline: "You just watched $2,000,000 leave a live account.",
      subheadline: "That does not happen by accident. It happens because the system is correct.",
      body: [
        "Most people will watch that video and still do nothing. They will tell themselves it is luck, or that it is not real, or that it is not possible for them.",
        "The people already inside this environment stopped making that argument. They followed the process. They understood the structure. And they watched what consistent, disciplined execution actually produces.",
        "You have seen the proof. The only question now is whether you are serious enough to apply.",
      ],
    },
    {
      type: "how_it_works",
      headline: "What the environment gives you",
      steps: [
        {
          number: 1,
          title: "Live execution — every day",
          body: "Every setup is called before Mo enters. You see the entry, the stop, the target, and the reasoning — before the position is opened. Nothing is posted after the fact.",
        },
        {
          number: 2,
          title: "The system behind the withdrawal",
          body: "The $2M cashout was not a single lucky trade. It is the result of a structured approach to entries, exits, and capital management applied consistently. That system is what you follow inside.",
        },
        {
          number: 3,
          title: "A specialist who activates your access",
          body: "Once your questionnaire is complete, a specialist contacts you, confirms your path, and walks you through every step — including opening and funding your account via the registration link we provide.",
        },
        {
          number: 4,
          title: "An environment that filters for seriousness",
          body: "Access is not open to everyone. This intake round has limited spots. People who treat trading like gambling are not accepted. If you are serious, you will be.",
        },
      ],
    },
    {
      type: "why",
      headline: "This round closes when the spots are gone.",
      subheadline: "There is no countdown timer. There is no fake urgency. There are simply a limited number of people accepted this week.",
      body: [
        "Every intake round is capped. When the spots fill, the application closes and the next round opens at a later date — sometimes weeks away.",
        "The video you watched does not get shown publicly. It is inside this application flow because we want the right people seeing it — not everyone.",
        "If you have watched it and you are still reading, you already know whether this is for you.",
      ],
    },
    {
      type: "testimonials_slider",
      headline: "From people already inside",
      layout: "slider",
      items: [
        { name: "James, London", quote: "I had seen a lot of trading content. This was the first time I watched someone withdraw that kind of money live and explain every step that led there." },
        { name: "Miguel, Barcelona", quote: "Two months in. The way I think about every position has completely changed. The structure does the work — you just have to follow it correctly." },
        { name: "Sophie, Dubai", quote: "I applied because of the video. I stayed because the process is real and it is explained properly, not just posted as alerts." },
        { name: "Isabella, Milan", quote: "The proof was enough for me to apply. The live sessions showed me the how. That combination is what I needed." },
      ],
    },
    {
      type: "authority_card",
      headline: "Mo — the person behind the withdrawal",
      name: "Full-time gold trader. 4+ years live track record.",
      imageSrc: "/offer/media/mo.jpg",
      body: [
        "The account you watched being withdrawn from is mine. That session was recorded live, unedited, with no prior knowledge it would be shared. It is what structured execution produces over time.",
        "I built GTMO because I wanted people to see the process — not just the results. Every entry I make is called live. Every exit is shared in real time. The community follows the same system that produced what you just watched.",
        "If you are serious, apply. Your specialist will take it from there.",
      ],
      signOff: ["Mo"],
    },
    {
      type: "faq",
      headline: "Questions before you apply",
      items: [
        { question: "Is the withdrawal video real?", answer: "Yes. It is an unedited recording of a live account withdrawal. No staging, no editing, no retrospective claims. The amount, the account, and the process are all visible in the video." },
        { question: "Does my money go to Mo or GTMO?", answer: "No. Your funding goes into your own trading account — not to us. GTMO access activates as a partnership benefit after your account is funded and verified. You trade your own capital." },
        { question: "Can I achieve the same result?", answer: "We do not promise any specific outcome. What we provide is the same system, the same live sessions, and the same structure. What you produce with it depends on your capital, your discipline, and market conditions." },
        { question: "What happens after I apply?", answer: "You complete a short questionnaire — under two minutes. A specialist reviews your profile and contacts you to confirm whether you are a fit for the current intake round and what your access path looks like." },
      ],
    },
    {
      type: "cta",
      headline: "Spots in this intake round are limited.",
      subheadline: "You have seen the proof. The application takes under two minutes. Your specialist follows up directly.",
      disclaimer: "Trading involves risk. The documented withdrawal is a real result and not a guarantee of what you will achieve. Past performance does not guarantee future returns. Your funding goes into your own trading account.",
    },
  ],
};
