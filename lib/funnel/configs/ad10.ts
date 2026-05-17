import type { FunnelConfig } from "@/lib/funnel/framework";

export const ad10Config: FunnelConfig = {
  id: "ad10",
  name: "Decentralized Masters Institutional",
  sourceRef: "Decentralized Masters / Tan Gera VSL — two markets structure",
  projectName: "GTMO Signals",
  primaryCtaLabel: "Apply for access",
  headerLogoSrc: "/offer/media/gtmologo.png",

  theme: {
    // Dark institutional — near-black with electric blue accent
    // Distinct from: ad4 amber/dark, ad7 gold/dark, ad8 purple/white, ad9 green/cream
    pageBg:           "#0d1117",
    pageText:         "#e6edf3",
    surfaceBg:        "#161b22",
    surfaceBorder:    "#30363d",
    cardBg:           "#161b22",
    cardBorder:       "#30363d",
    mutedText:        "#8b949e",
    headingColor:     "#ffffff",
    headingFont:      '"Inter", "Helvetica Neue", sans-serif',
    bodyFont:         '"Inter", "Helvetica Neue", sans-serif',
    // Electric blue — institutional/hedge fund energy
    accentBg:         "#1d6ae5",
    accentBgHover:    "#1558cc",
    accentFg:         "#ffffff",
    accentOnLight:    "#1d6ae5",
    // Band — deep blue gradient
    bandFrom:         "#0a1628",
    bandVia:          "#0d2040",
    bandTo:           "#0a1628",
    bandText:         "#ffffff",
    bandMuted:        "#8eb4e8",
    bandBulletBorder: "#1d4080",
    // Sticky bar
    stickyBg:         "#0d1117",
    stickyBorder:     "#30363d",
    // Layout
    maxWidth:         "640px",
    heroPaddingY:     "24px",
    sectionPaddingY:  "40px",
    // Marketing section CSS vars
    bodyColor:            "#c9d1d9",
    overlayBg:            "rgba(10,16,24,0.95)",
    accentContrast:       "#ffffff",
    headingWeight:        700,
    headingTransform:     "none",
    headingLetterSpacing: "-0.02em",
    btnRadius:            "6px",
    btnPadding:           "14px 28px",
    btnFontSize:          "15px",
    btnFontWeight:        700,
    btnTextTransform:     "none",
    cardRadius:           "8px",
    cardPadding:          "20px",
    cardShadow:           "none",
  },

  sections: [
    // ── Hero ──────────────────────────────────────────────────────────────
    {
      type: "hero",
      headline: "There Are Two Ways To Trade Gold. Most People Are In The Wrong One.",
      subheadline: "From the desk of Mo — Full-time gold trader, 4+ years live track record. $2,000,000 cashed out and documented below.",
      video: {
        src: "https://vz-f212c83f-59e.b-cdn.net/06c8df91-48fc-4ffd-b4b7-29796abe6da8/playlist.m3u8",
        minWatchSeconds: 0,
      },
      videoAspectRatio: "4/5",
    },

    // ── The two markets insight ────────────────────────────────────────────
    {
      type: "why",
      headline: "Let me explain what you just watched.",
      body: [
        "That was $2,000,000 leaving a live trading account. On camera. Unedited. The positions that generated it were called live — before they were opened — to the people inside GTMO.",
        "Everyone outside saw the result. The people inside saw the setup.",
        "That is the only difference that matters in trading. And it is a difference that almost no one talks about honestly.",
      ],
    },

    // ── Authority ──────────────────────────────────────────────────────────
    {
      type: "authority_card",
      headline: "A bit more on who I am.",
      name: "Mo — full-time gold trader, 4+ years live track record.",
      imageSrc: "/offer/media/mo.jpg",
      body: [
        "I have been operating in the XAU/USD market every trading day for over four years. In my first serious trading period, I made gains and gave most of them back. That taught me more about risk management than any course ever could.",
        "Since building the structured framework I now run inside GTMO, I have been able to operate consistently — and document it publicly. The $2M withdrawal you watched is one example. The 1,150+ pips called live in a single week is another.",
        "I built GTMO because I was frustrated by what was available to retail traders. Either expensive theory courses, or anonymous signal groups that post alerts after the position is already moving. There was no live environment where the reasoning was shown in real time — before execution.",
        "That is what GTMO is. And that gap is exactly what I want to explain to you now.",
      ],
      signOff: ["Mo"],
    },

    // ── The two trading worlds ─────────────────────────────────────────────
    {
      type: "why",
      headline: "Most people don't know that two worlds of trading exist.",
      subheadline: "And not knowing this is costing them significantly.",
      body: [
        "World one is where most retail traders operate. They follow social media, consume YouTube analysis, subscribe to signals groups that send alerts after the position is already running. They are always reacting — never positioned.",
        "World two is where serious traders operate. They see the setup before execution. They understand the entry level, the stop, the target, and the reasoning — before the position opens. They are positioned when the move happens, not scrambling to react to it.",
        "The people making consistent returns in gold are not smarter. They do not have access to secret information. They are simply in world two while almost everyone else is in world one.",
        "Here is the part that most people never hear: getting into world two does not require years of experience or significant capital. It requires access to a live environment where the setups are called before they open — and the reasoning is explained in real time.",
        "That is GTMO. And until now, that access was not available to most retail traders.",
      ],
    },

    // ── Documented proof ───────────────────────────────────────────────────
    {
      type: "stats",
      items: [
        { value: "$2M+", label: "cashed out live on camera — full withdrawal documented" },
        { value: "1,150+", label: "pips called live before execution in a single trading week" },
        { value: "$35K+", label: "secured in a single NFP session — positions shown in real time" },
      ],
    },

    // ── Specific proof examples (DM-style) ────────────────────────────────
    {
      type: "why",
      headline: "Let me show you what world two looks like with specific examples.",
      body: [
        "These are not highlights. They are documented sessions called live to GTMO members — before execution.",
        "The NFP session: Mo called the setup on the morning of the release. Entry level, stop, target — all shared before the position opened. By the time the move completed, $35,000 had been secured. Members who were in world two were positioned. Members in world one watched the candle after it closed.",
        "The 1,150+ pip week: Every setup that week was called live. Entry before execution, exit shared in real time. By the end of the week, the total pips across all calls exceeded 1,150. Not in a newsletter published the following Monday. Live. Before each trade opened.",
        "The $2M withdrawal: The account you watched being emptied did not accumulate that balance in a single trade. It accumulated through consistent, structured execution over time — using the same framework that is shared inside GTMO every trading day.",
        "The pattern is the same every time. World two sees the setup. World one sees the result.",
      ],
    },

    // ── Why timing matters now ─────────────────────────────────────────────
    {
      type: "why",
      headline: "Why the access gap matters more right now than it has in years.",
      subheadline: "Gold is in a phase where structure separates results from losses.",
      body: [
        "When markets trend cleanly, even poorly executed trades can work. When conditions become more complex — larger swings, faster reversals, more volatile sessions — the gap between world one and world two becomes extreme.",
        "The traders operating without a live framework are not just missing gains. They are taking losses that a clear setup structure would have avoided entirely.",
        "The entry level matters. The stop matters. The timing of the position matters. None of these are available in a signals group that posts alerts after the move has started. All of them are available inside GTMO — before the position opens.",
        "The people who are currently in world two are not going to tell you this. The access is worth more with fewer people inside it. I am telling you because GTMO's intake is limited and controlled — we are selective about who gets access for exactly that reason.",
      ],
    },

    // ── How it works ──────────────────────────────────────────────────────
    {
      type: "how_it_works",
      headline: "The three things GTMO gives you that world one never will.",
      steps: [
        {
          number: 1,
          title: "Access to live setups before execution",
          body: "Every trade Mo takes is called to GTMO members before the position opens. Entry level, stop, target, and the reasoning behind each decision — in real time, every trading day. Not posted after. Not shared in retrospect.",
        },
        {
          number: 2,
          title: "The framework behind the results",
          body: "A setup without context is just a signal. Inside GTMO, the market structure analysis, the logic of the entry, and the risk management framework are explained on every call. You understand why — not just what to do.",
        },
        {
          number: 3,
          title: "A specialist who activates your access one to one",
          body: "When your application is accepted, a specialist contacts you directly. They confirm your access level, send your registration link, and are one message away through every step. You are not left to figure it out alone.",
        },
      ],
    },

    // ── Testimonials ───────────────────────────────────────────────────────
    {
      type: "testimonials_slider",
      headline: "From inside world two.",
      layout: "slider",
      items: [
        { name: "James, London", quote: "I spent over a year in world one. Getting GTMO access felt like someone finally turned the lights on — I could see why every trade was being taken, not just that it was taken." },
        { name: "Miguel, Barcelona", quote: "The specific difference is being in position before the move, not scrambling to react after it. That one change is everything in gold." },
        { name: "Sophie, Dubai", quote: "I had tried three other communities. None of them called entries live before execution. The moment I saw Mo call a setup in real time before opening it — I understood what I had been missing." },
        { name: "Isabella, Milan", quote: "The framework matters as much as the signals. Understanding why an entry is taken at a specific level is what makes it repeatable. That is what GTMO teaches through the live sessions." },
      ],
    },

    // ── The comparison (DM-style "how much more money") ───────────────────
    {
      type: "why",
      headline: "The cost of staying in world one.",
      body: [
        "Most people will read what I have written here and go back to their signals group, their YouTube analysis, their reactive approach to the market. That is fine. The markets need participants on both sides.",
        "But understand what that decision costs — not in a hypothetical way, in a documented one.",
        "The NFP session that produced $35,000 was called live before the position opened. Members in world two were positioned. Everyone in world one saw the same candle — they just saw it after it closed.",
        "The 1,150+ pip week was called live, setup by setup, before each trade was executed. Members in world two followed in real time. World one watched the recap.",
        "The $2M withdrawal was the accumulation of structured, live execution over time. Documented publicly. The framework that produced it is the same one shared inside GTMO every trading day.",
        "The gap between world one and world two is not luck, experience, or capital. It is access. And that access is what the application below is for.",
      ],
    },

    // ── Final application framing (DM-style closing) ──────────────────────
    {
      type: "why",
      headline: "If you have read this far, you already understand the opportunity.",
      body: [
        "My only question is: how much has it already cost you to be in world one?",
        "Not rhetorically. Specifically. Every session where the setup was called live inside GTMO — and you were not positioned because you did not have access — that is the cost. It is not visible as a loss on your account. But it is real.",
        "The application takes under two minutes. A specialist contacts you to confirm your access level and walk you through every step. Your funding goes into your own trading account — not to us.",
        "We do not accept every application. GTMO is not a public channel. The quality of the environment depends on the seriousness of the people inside it.",
        "If you are serious about moving from world one to world two — submit your application. If you are not ready, no problem. But understand that the setups are being called live right now, and the people inside are positioned.",
        "The only question left is which side of that you are on.",
      ],
    },
  ],
};
