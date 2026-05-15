import type { FunnelConfig } from "@/lib/funnel/framework";

const VIDEO_SRC =
  typeof process !== "undefined"
    ? process.env.NEXT_PUBLIC_GTMO_AD6_VIDEO_URL ||
      process.env.NEXT_PUBLIC_GTMO_CODE_VIDEO_URL ||
      process.env.NEXT_PUBLIC_FUNNEL_VIDEO_URL ||
      ""
    : "";

/** Fortiora-inspired light layout: white surfaces, yellow CTAs (#f5c518), Inter. */
const ad6Theme = {
  pageBg: "#ffffff",
  pageText: "#0f172a",
  surfaceBg: "#f9fafb",
  surfaceBorder: "#e5e7eb",
  cardBg: "#ffffff",
  cardBorder: "#e5e7eb",
  mutedText: "#9ca3af",
  headingColor: "#0f172a",
  headingFont: '"Inter", "Helvetica Neue", system-ui, sans-serif',
  bodyFont: '"Inter", "Helvetica Neue", system-ui, sans-serif',
  accentBg: "#f5c518",
  accentBgHover: "#e5b008",
  accentFg: "#0f172a",
  accentOnLight: "#a16207",
  bandFrom: "#f9fafb",
  bandVia: "#f3f4f6",
  bandTo: "#f9fafb",
  bandText: "#0f172a",
  bandMuted: "#6b7280",
  bandBulletBorder: "rgba(245, 197, 24, 0.35)",
  stickyBg: "rgba(255, 255, 255, 0.97)",
  stickyBorder: "#e5e7eb",
  maxWidth: "640px",
  heroPaddingY: "24px",
  sectionPaddingY: "44px",
  bodyColor: "#374151",
  overlayBg: "rgba(17, 24, 39, 0.92)",
  accentContrast: "#0f172a",
  headingWeight: 700,
  headingTransform: "none",
  headingLetterSpacing: "-0.02em",
  btnRadius: "8px",
  btnPadding: "16px 32px",
  btnFontSize: "15px",
  btnFontWeight: 600,
  btnTextTransform: "none",
  cardRadius: "12px",
  cardPadding: "24px",
  cardShadow: "0 1px 4px rgba(0, 0, 0, 0.08)",
} as const;

export const ad6FunnelConfig: FunnelConfig = {
  id: "ad6",
  name: "Fortiora Corporate",
  sourceRef: "Fortiora Advisory — marketing template",
  projectName: "GTMO Signals",
  primaryCtaLabel: "Continue to questionnaire",
  headerLogoSrc: "/logo-gtmo-crown.png",
  theme: ad6Theme,
  sections: [
    {
      type: "hero",
      headline: "A reliable partner for your trading journey.",
      subheadline:
        "Structure, discipline, and live guidance — starting from your first funded account.",
      video: {
        src: VIDEO_SRC,
        minWatchSeconds: 0,
      },
      ctaLabel: "Apply for access",
    },
    {
      type: "stats",
      items: [
        { value: "Live", label: "Structured sessions with clear risk language" },
        { value: "Education", label: "Questionnaire-first onboarding — no hype ladders" },
        { value: "Community", label: "Members following the same lane in gold context" },
      ],
    },
    {
      type: "why",
      headline: "{projectName} — a clear path, not a promise",
      subheadline: "No guaranteed returns. No bots. No shortcuts.",
      body: [
        "We do not make vague promises or offer quick-rich programmes. What we provide is a **structured trading environment** built around live context and honest limits.",
        "Each access level is matched to your capital and experience. Your specialist confirms your path and activates access after your account is funded and verified.",
        "This is **education-first**. Your funding goes into your own trading account with Vantage — not to us.",
      ],
      ctaLabel: "Apply for access",
    },
    {
      type: "how_it_works",
      headline: "How to apply — 3 steps",
      steps: [
        {
          number: 1,
          title: "Complete the application",
          body: "Answer a short questionnaire. We match you to the right access level for your capital and experience.",
        },
        {
          number: 2,
          title: "Fund your trading account",
          body: "Your specialist sends a Vantage registration link. Fund your own account. GTMO access activates after verification.",
        },
        {
          number: 3,
          title: "Trade with live guidance",
          body: "Follow live sessions, access your matched products, and trade alongside members with real-time signal guidance when sessions run.",
        },
      ],
      ctaLabel: "Apply for access",
    },
    {
      type: "testimonials_slider",
      headline: "What members say",
      layout: "slider",
      items: [
        {
          name: "Felix, 38",
          quote:
            "Before I had a clear plan I was losing consistently. After following the structure I finally have a repeatable approach.",
        },
        {
          name: "Henrik, 29",
          quote:
            "I had never traded before. The questionnaire matched me to the right level and the guidance made the difference.",
        },
        {
          name: "Karla, 45",
          quote:
            "I invested in the access and within months my approach to trading completely changed. The structure is what I was missing.",
        },
        {
          name: "Josefa, 34",
          quote:
            "I now look at my trading with confidence and a clear strategy. Something I never had before joining.",
        },
      ],
    },
    {
      type: "authority_card",
      headline: "Meet Gold Trader Mo",
      name: "The trader behind {projectName}",
      imageSrc: "/offer/media/mo.jpg",
      body: [
        "I'm Mo — a full-time gold trader with 4+ years of live track record. Every session is live. Every entry is called before execution. Every exit is shared with the community in real time.",
        "I built GTMO because retail traders deserve the same structure and context that institutional desks take for granted. That is all this is.",
      ],
      signOff: ["Your trader,", "Mo"],
    },
    {
      type: "faq",
      headline: "Frequently asked questions",
      items: [
        {
          question: "What do I get from this?",
          answer:
            "A personal access path matched to your capital and experience, live trading sessions, signals, and a specialist who walks you through the next steps after your account is funded.",
        },
        {
          question: "When does my access start?",
          answer:
            "After your account deposit is verified by your specialist. The questionnaire takes under two minutes and your specialist follows up promptly.",
        },
        {
          question: "What results can I expect?",
          answer:
            "We do not promise results. We provide structure, live guidance, and education. Outcomes depend on market conditions and how you manage your account.",
        },
        {
          question: "Do I need trading experience?",
          answer:
            "No. The questionnaire matches you to the right access level. Beginners start with structured education. Experienced traders get live signals and VIP access.",
        },
        {
          question: "Can I get further guidance later?",
          answer:
            "Yes. Your specialist remains your point of contact and higher access levels are available as your account grows.",
        },
      ],
    },
    {
      type: "cta",
      headline: "Ready to take your trading seriously?",
      subheadline:
        "Complete the short application and your specialist will be in touch to walk you through the next step.",
      ctaLabel: "Apply for access",
      disclaimer:
        "Trading involves risk. Past results do not guarantee future returns. Your funding goes into your own Vantage trading account.",
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
        "**Advertising notice:** This page is marketing and education material for {projectName}. It is not personalized advice.",
        "**Risk:** Trading and leveraged products can result in rapid losses. Only proceed with money you can afford to lose.",
        "**Testimonials:** Quotes are illustrative and not verified performance claims.",
      ],
    },
  ],
};
