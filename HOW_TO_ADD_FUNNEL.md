# How to add a new funnel variant

## The two files required

### 1. lib/funnel/content-adN.ts — gate + ticker
Copy content-ad6.ts. Update:
- positioningGate.headline
- positioningGate.subcopy (3 paragraphs)
- socialProofTicker (3 bullet strings)
- Keep offer: { mode: "funnel_template" } unchanged

### 2. lib/funnel/configs/adN.ts — offer page
Copy configs/ad6.ts. Update:
- id, name, sourceRef
- All theme values from source funnel CSS (see table below)
- All sections with GTMO-adapted content

## The four registration steps

### lib/funnel/content.ts
Import: import { adNVariantConfig } from "./content-adN";
Add to map: adN: adNVariantConfig,

### lib/funnel/configs/registry.ts
Import: import { adNConfig } from "./adN";
Add to map: "adN": adNConfig,

### lib/funnel/normalize.ts
Add "adN" to the valid AdVariant type and/or array.

### Neon SQL editor
INSERT INTO offers (name, type, weight, active)
VALUES ('adN', 'code_lp', 1, true);

## Section types — marketing sections only

Use only these for all new funnels (ad6 onwards):

hero               video or image + headline + subheadline + ctaLabel
stats              items: { value, label }[] — use 3 items
why                headline + subheadline + body[] + optional image + optional ctaLabel
how_it_works       headline + steps[{ number, title, body }] + optional ctaLabel
testimonials_slider headline + layout:"slider" + items[{ name, quote, imageSrc? }]
authority_card     headline + name + imageSrc + body[] + signOff[]
faq                headline + items[{ question, answer }]
cta                headline + subheadline + ctaLabel + disclaimer

NEVER use: hero_split, join, urgency_band, corp_header, corp_video_row,
           corp_hero_start, corp_topic_cards, corp_value_tiles, corp_path_steps,
           corp_reviews, corp_how_band, corp_split_work, corp_three_cards,
           corp_faq, corp_final_cta

Those exist only for ad4 and ad5 backward compatibility.

## Theme token extraction

Open the source funnel HTML/CSS. Copy these values directly:

pageBg           body background-color
pageText         body color
surfaceBg        card or section background
surfaceBorder    border-color on cards/sections
cardBg           individual card background
cardBorder       card border-color
mutedText        secondary text color
headingColor     h1/h2 color
headingFont      h1/h2 font-family (full stack with fallbacks)
bodyFont         body/p font-family (full stack with fallbacks)
accentBg         primary CTA button background-color
accentBgHover    primary CTA button :hover background-color
accentFg         primary CTA button text color
accentOnLight    accent color for text on white surfaces (usually darker shade)
stickyBg         sticky bottom bar background
stickyBorder     sticky bottom bar border-top color
headingWeight    h1/h2 font-weight
headingTransform h1/h2 text-transform
btnRadius        button border-radius
btnPadding       button padding
btnFontSize      button font-size
btnFontWeight    button font-weight
cardRadius       card border-radius
cardPadding      card padding
cardShadow       card box-shadow

For bandFrom/Via/To: use light grays (#f9fafb, #f3f4f6, #e5e7eb) if no dark band.
Always set maxWidth to "640px" — this is a mini app, not a desktop page.

## Content rules

- All copy must be GTMO-specific. Do not carry any copy from source funnels.
- No guaranteed returns, no specific accuracy percentages, no income claims.
- No single named broker in offer copy; use neutral “registration link” / “your trading account” (specialist may offer multiple brokers).
- No deposit amounts in offer copy.
- Testimonials: qualitative only — no dollar amounts, no account balance claims.
- Always include a risk disclaimer in the cta section disclaimer field.

## Verification

After adding adN, confirm all of these:
  □ /offer?variant=adN matches the source funnel's visual style
  □ /offer?variant=ad4 unchanged
  □ /offer?variant=ad5 unchanged
  □ /offer?variant=ad6 unchanged
  □ npx tsc --noEmit passes
  □ SELECT name, active FROM offers WHERE name = 'adN'; returns one active row
