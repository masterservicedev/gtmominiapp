# UTM Tracking Setup — GTMO Mini App

## What UTM tracking does

UTM parameters tell the admin dashboard which ad campaign, traffic source, and creative brought each user into the mini app. Without them, all traffic shows as "direct" and you cannot tell which campaigns produce deposits.

---

## How it works in Telegram

Standard web UTM params (`?utm_source=...`) can appear on the Web App URL when Telegram opens it; the client reads `window.location.search` and sends `utmSource` / `utmCampaign` / `utmContent` to `/api/init`.

For **Telegram deep links**, the bot URL uses `startapp`:

```
https://t.me/YourMiniAppBot/app?startapp=PAYLOAD
```

The mini app reads the raw payload via `WebApp.initDataUnsafe.start_param` and sends it as **`startParam`** in the JSON body. **`/api/init`** parses it with [`lib/startParam.ts`](../lib/startParam.ts) (authoritative) so attribution is consistent even if the client changes.

---

## Payload format (key / value)

Use underscore-separated keys with **greedy** values (values may contain underscores until the next known key: `cid`, `src`, `cmp`, `var`):

```
cid_VOLUUMID_src_tgads_cmp_CAMPAIGNNAME_var_VARIANT
```

Examples:

```
cid_abc123_src_tgads_cmp_gold_signals_may_var_lp2
cid_xyz789_src_tgads_cmp_vip_launch_uae_var_vid1
cid_ref001_src_referral_cmp_referral_may_var_lp1
```

Decoded:

- `cid` → Voluum / click ID (stored as `voluum_cid`)
- `src` → traffic source (stored as `utm_source` when URL UTM not set)
- `cmp` → campaign name (stored as `utm_campaign` when URL UTM not set)
- `var` → offer variant (stored as `entry_variant` when client does not override)

**Referrals:** `ref_USERID` sets `utm_source` / `utm_campaign` to `referral` and records `referrerId` in the parse result (extend persistence if you add a referrer FK later).

**Legacy:** payloads without those keys still use Voluum-style rules (`clickid_ad4`, `prefix_clickid_variant`, etc.) — see `parseLegacyVoluum` in [`lib/startParam.ts`](../lib/startParam.ts).

---

## Parser behavior (implementation)

1. **`ref_*`** — treated as referral; no key/value scan.
2. **Key/value** — scan tokens split by `_`; on `cid` / `src` / `cmp` / `var`, consume all following tokens until the next known key, then `join('_')` (so `cmp_gold_signals_may` works).
3. **If no such keys** — fall back to legacy positional parsing used before this doc.

---

## How to build deep links for each campaign

### Telegram Ads

Set the destination URL as:

```
https://t.me/YourMiniAppBot/app?startapp=cid_{clickid}_src_tgads_cmp_CAMPAIGN_var_VARIANT
```

Replace `{clickid}` with Telegram Ads' click ID macro per their docs.

### Manual / referral links

```
https://t.me/YourMiniAppBot/app?startapp=cid_NONE_src_referral_cmp_referral_may_var_lp1
```

### Voluum redirect

If routing through Voluum first:

1. Destination URL:
   ```
   https://t.me/YourMiniAppBot/app?startapp=cid_{clickid}_src_tgads_cmp_CAMPAIGN_var_VARIANT
   ```
2. Voluum substitutes `{clickid}` into the payload.
3. Mini app stores `voluum_cid` and UTMs from `src` / `cmp` as above.

---

## Code references (this repo)

**Parser:** [`lib/startParam.ts`](../lib/startParam.ts) — `parseStartParam`, `StartParamParsed`.

**Init (merge URL UTM + `start_param`, persist):** [`app/api/init/route.ts`](../app/api/init/route.ts).

**Client (sends `startParam` + URL UTMs):** [`app/page.tsx`](../app/page.tsx).

Precedence in `/api/init`:

- **Variant:** non-empty `entryVariant` from body → else `var` from `start_param` → else offer rotation / sticky user / random active offer.
- **Click ID:** `cid` from `start_param` → else `voluumCid` from body.
- **UTM columns:** URL/body `utmSource` / `utmCampaign` / `utmContent` when set; else `src` / `cmp` from `start_param` for source/campaign. `utm_content` stays URL-only unless you extend the schema.
- **IP / geo:** Client IP is taken from `x-forwarded-for` / `x-real-ip`, stored as `signup_ip` (first session only) and `last_seen_ip` (every session), and used for `country` / `country_code` via ipapi. Admin **Traffic** and user detail show these fields.

---

## Naming conventions for campaigns

| Campaign type      | Naming pattern           | Example              |
|-------------------|---------------------------|----------------------|
| Product-specific  | `product_market_month`    | `school_uae_may`     |
| Signal-based      | `signals_descriptor_month`| `gold_signals_may` |
| VIP launch        | `vip_market_month`        | `vip_launch_uae_may` |
| Retargeting       | `retarget_segment_month`  | `retarget_mid_may`   |
| Referral          | `referral_month`          | `referral_may`       |

Use underscores only inside `cmp` values (parser supports multi-segment names). Avoid spaces.

---

## Voluum postback verification

1. Click a test deep link from Telegram.
2. Complete the questionnaire as HIGH intent.
3. Reply READY to the bot.
4. Check Neon — user row should have `utm_source`, `utm_campaign`, `voluum_cid` (and URL UTMs if present) as expected.
5. Check Voluum postbacks if wired.
6. Check **Admin → Traffic** for campaign/source rows.

If `utm_campaign` is null, confirm `start_param` is populated (Telegram only, not plain browser) and that the payload includes `cmp_...`.

---

## Quick reference — link builder

Replace `YourMiniAppBot` with your bot username and `{clickid}` with the ad network macro when applicable.

```
Base: https://t.me/YourMiniAppBot/app?startapp=

Gold signals UAE (lp2):
https://t.me/YourMiniAppBot/app?startapp=cid_{clickid}_src_tgads_cmp_gold_signals_uae_var_lp2

VIP launch UK (vid1):
https://t.me/YourMiniAppBot/app?startapp=cid_{clickid}_src_tgads_cmp_vip_launch_uk_var_vid1

School promo Saudi (lp1):
https://t.me/YourMiniAppBot/app?startapp=cid_{clickid}_src_tgads_cmp_school_promo_sa_var_lp1

Referral (no Voluum):
https://t.me/YourMiniAppBot/app?startapp=cid_NONE_src_referral_cmp_referral_may_var_lp1

Organic (channel post):
https://t.me/YourMiniAppBot/app?startapp=cid_NONE_src_organic_cmp_channel_post_var_lp2
```

---

## Related docs

- Environment variables: [02_ENVIRONMENT_VARIABLES.md](02_ENVIRONMENT_VARIABLES.md)
