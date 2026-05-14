import type { FunnelConfig } from "@/lib/funnel/framework";

const VIDEO_SRC =
  typeof process !== "undefined"
    ? process.env.NEXT_PUBLIC_GTMO_AD6_VIDEO_URL ||
      process.env.NEXT_PUBLIC_GTMO_CODE_VIDEO_URL ||
      process.env.NEXT_PUBLIC_FUNNEL_VIDEO_URL ||
      ""
    : "";

/** Corporate light/dark split + yellow band — inspired by Fortiora-style landers; values are explicit per config. */
const ad6Theme = {
  pageBg: "#ffffff",
  pageText: "#1a1a1a",
  surfaceBg: "#ffffff",
  surfaceBorder: "#e8e8e8",
  cardBg: "#fafafa",
  cardBorder: "#e5e5e5",
  mutedText: "#525252",
  headingColor: "#1a1a1a",
  headingFont: 'Georgia, "Times New Roman", Times, serif',
  bodyFont:
    'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  accentBg: "#047857",
  accentBgHover: "#059669",
  accentFg: "#ffffff",
  accentOnLight: "#047857",
  bandFrom: "#1a1a1a",
  bandVia: "#262626",
  bandTo: "#1a1a1a",
  bandText: "#fafafa",
  bandMuted: "rgba(250, 250, 250, 0.85)",
  bandBulletBorder: "rgba(16, 185, 129, 0.35)",
  stickyBg: "rgba(255, 255, 255, 0.97)",
  stickyBorder: "#e5e5e5",
  maxWidth: "72rem",
  heroPaddingY: "1.25rem",
  sectionPaddingY: "3rem",
  corpDarkBg: "#1a1a1a",
  corpDarkText: "#fafafa",
  corpDarkMuted: "#a3a3a3",
  corpYellowBg: "#f7dc6f",
  corpYellowText: "#1a1a1a",
  corpNavLink: "#404040",
} as const;

export const ad6FunnelConfig: FunnelConfig = {
  id: "ad6",
  name: "GTMO — corporate trust layout (ad6)",
  projectName: "GTMO Signals",
  primaryCtaLabel: "Continue to questionnaire",
  headerLogoSrc: "/logo-gtmo-crown.png",
  theme: ad6Theme,
  sections: [
    {
      type: "corp_header",
      advertorialLine:
        "— Educational advertorial · Not financial advice · Risk of loss applies —",
      logoSrc: "/logo-gtmo-crown.png",
      navLinks: [
        { label: "About", href: "#about" },
        { label: "How it works", href: "#path" },
        { label: "Reviews", href: "#review" },
        { label: "FAQ", href: "#faq" },
      ],
    },
    {
      type: "corp_video_row",
      video: { src: VIDEO_SRC, minWatchSeconds: 0 },
      caption:
        "Short onboarding brief. This is orientation only — not a recommendation to buy, sell, or use leverage.",
    },
    {
      type: "corp_hero_start",
      headline: "{projectName} is for traders who want a calmer lane in gold — not another noisy feed.",
      headlineItalic: "Watch the brief, then continue into the in-app questionnaire when you are ready.",
      paragraphs: [
        "If you are trying to save for major goals, trade with more structure, or simply understand **risk before size**, you are in the right kind of room. We focus on **discipline, clarity, and honest limits** — not hype, not “secret levels,” and not guaranteed outcomes.",
        "This page explains how we think about context and process. **No miracle promises.** If the tone matches how you want to learn, use the fixed button at the bottom to continue.",
      ],
      heroImageFile: "/offer/media/mo.jpg",
    },
    {
      type: "corp_topic_cards",
      title: "{projectName} —",
      titleItalic: "clear framing and real-world discipline",
      intro:
        "Today’s markets are loud. We prefer a simple standard: name the scenario, name the risk, and keep the workflow repeatable — starting with a short, structured intake.",
      cards: [
        {
          eyebrow: "Scenario — volatile opens",
          body: "Members who treat preparation like a checklist often report **fewer impulsive entries** when liquidity is messy — not because markets became “easy,” but because the process stayed consistent.",
        },
        {
          eyebrow: "Scenario — information overload",
          body: "When everything feels urgent, a single lane for **how context is delivered** can reduce thrash. We bias toward clarity over volume.",
        },
        {
          eyebrow: "Scenario — risk first",
          body: "Leverage can amplify losses as well as gains. We keep **stops, sizing, and worst-case language** in normal conversation — not as fine print after the fact.",
        },
        {
          eyebrow: "Scenario — fit matters",
          body: "We decline applicants who need guarantees or “passive income” fantasy framing. That constraint is intentional — it protects the room and the staff.",
        },
      ],
    },
    {
      type: "corp_value_tiles",
      title: "{projectName} —",
      titleItalic: "clarity, strategy, restraint",
      introParagraphs: [
        "We build plans you can actually execute: transparent language, realistic pacing, and a community culture that treats markets as risky — not as a slot machine.",
        "Our values:",
      ],
      tilesLabel: "What we optimize for",
      tiles: [
        { imageFile: "/offer/media/gtmologo.png", title: "Transparency" },
        { imageFile: "/offer/media/gtmologo.png", title: "Responsibility" },
        { imageFile: "/offer/media/gtmologo.png", title: "Professionalism" },
        { imageFile: "/offer/media/gtmologo.png", title: "Reliability" },
      ],
      bottomLine: "Your goals, our process — with risk named early and often.",
    },
    {
      type: "corp_path_steps",
      title: "Why complete the intake",
      titleItalic: "before anything formal?",
      introParagraphs: [
        "The questionnaire is not a sales script. It helps us route you correctly and protect capacity for people who genuinely want an education-first path in gold.",
        "Unlike anonymous “autopilot” funnels, we care whether you understand **what live context means here** — including what we do not promise.",
      ],
      pathLeadIn: "A typical path through {projectName}:",
      steps: [
        {
          num: "01",
          title: "You read the brief and answer the short questionnaire — so expectations match reality.",
        },
        {
          num: "02",
          title: "If there is a fit, next steps are explained in plain language. If not, you should get a clean boundary.",
        },
        {
          num: "03",
          title: "If you continue, you reinvest attention into process — not into chasing random headlines.",
        },
        {
          num: "04",
          title: "Support stays oriented around structure: prep, risk language, and orderly updates — not hype ladders.",
        },
        {
          num: "05",
          title: "The goal is a steadier foundation: fewer chaotic decisions, more repeatable habits — still with market risk.",
        },
      ],
    },
    {
      type: "corp_reviews",
      title: "Why structure changes how people feel",
      titleItalic: "community voices (illustrative)",
      introParagraphs: [
        "Forget “get rich quick” fantasies and anonymous automation theatre. {projectName} is built around education, live discussion, and a shared vocabulary for risk.",
        "The quotes below are **illustrative member-style feedback** — not guarantees, not audited performance, and not a substitute for your own judgment.",
      ],
      items: [
        {
          name: "Alex, 38",
          role: "From chaotic screens to a calmer routine",
          imageFile: "/offer/media/laura.jpg",
          quote:
            "I used to chase headlines and regret entries. Here the tone is slower and the risk talk matches how I actually think about size — **still hard markets**, but less self-sabotage.",
        },
        {
          name: "Jordan, 29",
          role: "First structured learning pass",
          imageFile: "/offer/media/chris.jpg",
          quote:
            "I was afraid of blowing savings on impulse. The intake forced me to name what I was optimizing for. **No one promised profits** — but I finally had a checklist I could trust.",
        },
        {
          name: "Sam, 45",
          role: "Small business owner, limited time",
          imageFile: "/offer/media/magda.jpg",
          quote:
            "I needed a lane that respects that I cannot watch charts all day. The workflow is explicit about limits and what “live” means — **not** a hidden autopilot story.",
        },
        {
          name: "Riley, 34",
          role: "Planning a big life transition",
          imageFile: "/offer/media/paulo.jpg",
          quote:
            "I wanted a plan that acknowledges volatility instead of pretending it away. The community language around risk made it easier to stay consistent — **outcomes still vary**.",
        },
      ],
    },
    {
      type: "corp_how_band",
      title: "How we work",
      titleItalic: "and what “results” means here",
      intro: "Simple, operational, and honest about limits:",
      steps: [
        {
          kicker: "You arrive",
          body: "**You want** professional context and a structured way to think about gold — without being shouted at by a feed.",
        },
        {
          kicker: "During onboarding",
          body: "**We clarify** how information is shared, how risk is discussed, and what the next step is if there is a match.",
        },
        {
          kicker: "The outcome",
          body: "**You leave** with clearer habits — or a clean stop. Markets can still move against you; discipline does not remove risk.",
        },
      ],
    },
    {
      type: "corp_split_work",
      title: "People behind the process",
      titleItalic: "who show up with standards",
      h3: "We care about transparency, speed of communication, and precision in language — because confusion becomes expensive in markets.",
      bullets: [
        "**Individual routing** — the questionnaire exists to match you properly, not to pressure you.",
        "**Support with boundaries** — we are not a broker; we do not pretend to execute trades for you.",
        "**Modern tooling** — built for mobile reality and for environments where autoplay and heavy widgets fail.",
      ],
      imageFile: "/offer/media/mo.jpg",
    },
    {
      type: "corp_three_cards",
      title: "Continue in three straight steps",
      titleItalic: "(inside this mini-app)",
      cards: [
        {
          imageFile: "/offer/media/gtmologo.png",
          title: "Use this brief",
          body: "Skim the sections above so tone, limits, and cadence make sense before you tap continue.",
        },
        {
          imageFile: "/offer/media/gtmologo.png",
          title: "Answer the questionnaire",
          body: "Short, structured questions so we can route you without spam ladders or mystery steps.",
        },
        {
          imageFile: "/offer/media/gtmologo.png",
          title: "Wait for a clear next message",
          body: "If there is a fit, you will hear what happens next. If not, you should still leave with a clean boundary.",
        },
      ],
    },
    {
      type: "corp_faq",
      title: "Frequently asked questions",
      items: [
        {
          question: "Is this financial advice?",
          answer:
            "No. Nothing here tells you what to buy or sell. It is general education and orientation. You are responsible for your decisions and for rules where you live.",
        },
        {
          question: "Will I make money?",
          answer:
            "Markets can move against you quickly. You can lose some or all of your capital, especially with leverage. Past examples are not reliable guides to your future.",
        },
        {
          question: "What happens after the questionnaire?",
          answer:
            "If there is a match, next steps are explained clearly. If not, you should expect a clean stop — not an endless upsell chain.",
        },
        {
          question: "Do I need experience?",
          answer:
            "No — but you do need patience and the ability to read risk disclosures. We explain concepts plainly; we do not promise skill transfers as guaranteed outcomes.",
        },
        {
          question: "Can I come back later?",
          answer:
            "Yes. If you are unsure, close the page and return only if slow, structured process still sounds better than another loud funnel.",
        },
      ],
    },
    {
      type: "corp_final_cta",
      title: "Ready to take the next step",
      titleItalic: "on your own terms?",
      paragraphs: [
        "If this still sounds like the right kind of room — **education-first, risk-forward, intentionally small** — continue using the button fixed at the bottom of the screen.",
        "If it does not sound right, that is also a valid outcome. **No shame in stopping.**",
      ],
    },
    {
      type: "footer",
      footerLinks: [
        { label: "Privacy", href: "#" },
        { label: "Risk", href: "#" },
        { label: "Terms", href: "#" },
        { label: "Report a concern", href: "#" },
      ],
      disclaimerParagraphs: [
        "**Advertising notice:** This page is marketing and education material for {projectName}. It is not a regulated financial product page and not personalized advice.",
        "**Risk:** Trading and leveraged products can result in rapid losses. You should only proceed with money you can afford to lose.",
        "**Testimonials:** Quotes are illustrative community-style feedback and not verified performance claims.",
        "**Eligibility:** You must comply with laws that apply to you. We do not claim third-party endorsements that do not exist.",
      ],
    },
  ],
};
