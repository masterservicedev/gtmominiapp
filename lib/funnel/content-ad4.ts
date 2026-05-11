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
    logoSrc: "/logo-gtmo-crown.png",
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
    projectName: "GTMO Code",
    headerLogoSrc: "/logo-gtmo-crown.png",
    primaryCtaLabel: "Continue to application",
    video: {
      src: VIDEO_SRC,
      minWatchSeconds: 0,
    },
    intro: {
      h1: "Markets reward clarity and discipline — not noise.",
      h2: "Live gold context, risk-first framing, and full transparency on how ideas are managed.",
      h3: "This is not a tip line. You follow a professional who trades with real capital, explains risk before entries, and walks through decisions as conditions change — so you see the process, not just a headline.",
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
    vacationsTitle: "Here are some of our past vacations",
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
          "When I joined The {projectName} 2 months ago, never could have I ever imagined the series of events that would unfold just days after locking in my free software. I was able to clear my $131,382 debt. There is no greater feeling than to be debt-free. Now, I’m in the process of buying my dream home. I still can’t believe this is all really happening…I’m forever grateful to Mo.",
      },
      {
        name: "Michael Zusman",
        imageFile: "/offer/media/michael.jpg",
        quote:
          "The results of the software speaks for itself...just as promised, I made over $13,000 every single day. Do I really need to say more?",
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
          "Surprisingly, I used to be an investor on Wall Street. And I’ve never seen anything like this in my 10 year tenure at the company. My colleagues all thought I was crazy when I quit the firm to invest with the {projectName} software full-time. $384,594 in profits later, all of my colleagues are now BEGGING me to let them in.",
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
      subtitleLines: ["The Genius Behind The", "GTMO Code"],
      bodyParagraphs: [
        "Hi — I’m Mo. I’m a **full-time trader** with **4+ years** of track record in this industry — not a spectator, not a hobbyist.",
        "I built a gold-focused framework and tools around disciplined execution and risk — the kind of structure you need when markets move against you.",
        "This presentation is about process and fit — not hype. Watch the brief above, then continue only if you’re ready for honest risk talk and a clear next step.",
        "If you want to explore how we approach gold with structure, the video above is the fastest way to see whether this path aligns with you.",
      ],
      imageFile: "/offer/media/mo.jpg",
      signOffLines: ["Your Friend,", "Mo"],
    },
    footerLinks: [
      { label: "Website Agreement", href: "#" },
      { label: "Risk Disclaimer", href: "#" },
      { label: "Privacy Policy", href: "#" },
      { label: "Report Abuse", href: "#" },
      { label: "Contact Us", href: "#" },
    ],
    disclaimerParagraphs: [
      "**REGULATION & HIGH RISK INVESTMENT WARNING:** Trading Forex, CFDs and Cryptocurrencies is highly speculative, carries a level of risk and may not be suitable for all investors. You may lose some or all of your invested capital, therefore you should not speculate with capital that you cannot afford to lose. Please click here to read a full risk warning. GTMO Code is a technology, marketing and advertising service. GTMO Code does not gain or lose profits based on your trading results and operates as a technology, marketing and advertising service. GTMO Code is not a financial services firm and does not operate as a financial services firm and is only used as a marketing tool by third party advertisers and brokers to attract customers. It is your obligation to check and decide whether the broker you were connected to applies to all local rules and regulations and is regulated in your country jurisdiction and is allowed to receive customers from your location you are in, before you fund your account with the broker and start trading with it. Please report GTMO Code (by clicking report abuse) if you find that the broker assigned to you is not regulated in your jurisdiction so we can cancel your account with GTMO Code.",
      "We are required to tell potential investors that our software's past performance does not necessarily predict future results, therefore you should not speculate with capital that you cannot afford to lose.",
      "**USA REGULATION NOTICE:** Option trading is not regulated within the United States. GTMO Code is not supervised or regulated by any financial agencies nor US agencies. Any unregulated trading activity by U.S. residents is considered unlawful. GTMO Code does not accept customers located within the United States or holding an American citizenship.",
      "**SITE RISK DISCLOSURE:** GTMO Code does not accept any liability for loss or damage as a result of reliance on the information contained within this website; this includes education material, price quotes and charts, and analysis. Please be aware of the risks associated with trading the financial markets; never invest more money than you can risk losing. The risks involved in trading Forex, CFDs and Cryptocurrencies may not be suitable for all investors. GTMO Code doesn't retain responsibility for any trading losses you might face as a result of using the data hosted on this site.",
      "**LEGAL RESTRICTIONS:** Without limiting the undermentioned provisions, you understand that laws regarding financial contracts vary throughout the world, and it is your responsibility to make sure you properly comply with any law, regulation or guideline in your country of residence regarding the use of the Site. To avoid any doubt, the ability to access our Site does not necessarily mean that our Services and/or your activities through the Site are legal under the laws, regulations or directives relevant to your country of residence.",
      "Please note that GTMO Code receives advertising fees for directing users to open an account with the brokers/advertisers and/or for driving traffic to the advertiser website.",
      "If you feel you landed on this page by wrongdoings and/or misleading information of an advertisement, pre lander, email or any other promotions of a 3rd party website/promoter, please report it by clicking REPORT ABUSE.",
      "We have placed cookies on your computer to help improve your experience when visiting this website. You can change cookie settings on your computer at any time. Use of this website indicates your acceptance of this website's Privacy Policy.",
      "© 2026 All Rights Reserved - GTMO Code",
    ],
  },
};
