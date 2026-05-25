import { NextRequest, NextResponse } from "next/server";
import { validateInitData } from "@/lib/validation";
import { db } from "@/lib/db";
import { users, events, offers } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import axios from "axios";
import { normalizeEntryVariant } from "@/lib/funnel/normalize";
import { parseStartParam } from "@/lib/startParam";
import { getClientIpRaw, normalizeStoredClientIp } from "@/lib/client-ip";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      initData,
      voluumCid,
      entryVariant,
      utmSource,
      utmCampaign,
      utmContent,
      startParam: bodyStartParam,
    } = body as {
      initData?: unknown;
      voluumCid?: string | null;
      entryVariant?: string | null;
      utmSource?: string | null;
      utmCampaign?: string | null;
      utmContent?: string | null;
      startParam?: string | null;
    };

    if (typeof initData !== "string") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const validated = validateInitData(initData);
    const tgUser = validated.user;

    // Use signed start_param from initData as authoritative source
    const validatedStartParam = validated.startParam ?? "";
    const bodyStart =
      typeof bodyStartParam === "string" ? bodyStartParam : "";
    const rawStart = bodyStart || validatedStartParam || "";
    if (
      bodyStart &&
      validatedStartParam &&
      bodyStart !== validatedStartParam
    ) {
      console.warn("[init] startParam mismatch — using signed value", {
        body: bodyStart,
        signed: validatedStartParam,
      });
    }
    const startParam = validatedStartParam || rawStart;

    /** Authoritative parse of Telegram `start_param` (also sent raw from client for logging consistency). */
    const parsed = parseStartParam(startParam);

    const fromBodyCid =
      typeof voluumCid === "string" && voluumCid.trim()
        ? voluumCid.trim()
        : null;
    const fromParsedCid = parsed.cid?.trim() || null;
    /** Prefer `start_param` cid over body when present (campaign links). */
    const effectiveCid = fromParsedCid ?? fromBodyCid;

    const ipRaw = getClientIpRaw(req);
    const ipForGeo = ipRaw || "0.0.0.0";
    const storedClientIp = normalizeStoredClientIp(ipRaw);

    let country: string | null = null;
    let countryCode: string | null = null;
    try {
      const geo = await axios.get(`https://ipapi.co/${ipForGeo}/json/`, {
        timeout: 5000,
      });
      country = geo.data.country_name ?? null;
      countryCode = geo.data.country_code ?? null;
    } catch {
      country = null;
      countryCode = null;
    }

    const existing = await db
      .select()
      .from(users)
      .where(eq(users.telegramId, tgUser.id))
      .limit(1);

    const fromClient =
      typeof entryVariant === "string" && entryVariant.trim()
        ? entryVariant.trim()
        : undefined;

    const activeOffers = await db
      .select()
      .from(offers)
      .where(eq(offers.active, true));

    /** Explicit `entryVariant` from client wins; then `start_param` `var`; else random active offer or env fallback. */
    const startParamVariant = parsed.variant?.trim() || null;
    // Treat any incoming source/campaign/cid as attribution signal,
    // not only variant. Link builder links carry src + cmp but no var.
    const hasIncomingAttribution = Boolean(
      startParamVariant || parsed.source || parsed.campaign || parsed.cid,
    );

    let variant: string | null | undefined = fromClient;
    if (!variant && startParamVariant) {
      variant = startParamVariant;
    }

    if (!variant) {
      if (activeOffers.length === 0) {
        /** No active offers: do NOT use sticky user row (ops cleared rotation). */
        const fb = process.env.FUNNEL_FALLBACK_VARIANT?.trim();
        variant = fb || "ad5";
      } else {
        variant =
          activeOffers[Math.floor(Math.random() * activeOffers.length)]!.name;
      }
    }

    const normalizedVariant = normalizeEntryVariant(variant);

    const trimAttr = (v: unknown) =>
      typeof v === "string" && v.trim() ? v.trim().slice(0, 512) : null;
    /** URL/query UTM wins when set; else map from `start_param` (`src` / `cmp`). `utm_content` stays URL-only. */
    const nextUtmSource =
      trimAttr(utmSource) ??
      (parsed.source?.trim() ? parsed.source.trim().slice(0, 512) : null);
    const nextUtmCampaign =
      trimAttr(utmCampaign) ??
      (parsed.campaign?.trim()
        ? parsed.campaign.trim().slice(0, 512)
        : null);
    const nextUtmContent = trimAttr(utmContent);
    const utmPatch =
      nextUtmSource != null ||
      nextUtmCampaign != null ||
      nextUtmContent != null
        ? {
            ...(nextUtmSource != null ? { utmSource: nextUtmSource } : {}),
            ...(nextUtmCampaign != null ? { utmCampaign: nextUtmCampaign } : {}),
            ...(nextUtmContent != null ? { utmContent: nextUtmContent } : {}),
          }
        : {};

    let userId: string;

    if (existing.length === 0) {
      const [newUser] = await db
        .insert(users)
        .values({
          telegramId: tgUser.id,
          username: tgUser.username || null,
          firstName: tgUser.first_name || null,
          languageCode: tgUser.language_code || null,
          voluumCid: effectiveCid,
          entryVariant: normalizedVariant,
          utmSource: nextUtmSource,
          utmCampaign: nextUtmCampaign,
          utmContent: nextUtmContent,
          country,
          countryCode,
          signupIp: storedClientIp,
          lastSeenIp: storedClientIp,
          source: "mini_app",
          miniAppUser: true,
          bundleEligible: true,
        })
        .returning();

      userId = newUser!.id;
    } else {
      userId = existing[0]!.id;
      await db
        .update(users)
        .set({
          lastSeenAt: new Date(),
          country,
          countryCode,
          lastSeenIp: storedClientIp,
          ...(hasIncomingAttribution
            ? {
                entryVariant: normalizedVariant,
                ...utmPatch,
                ...(effectiveCid ? { voluumCid: effectiveCid } : {}),
              }
            : {}),
        })
        .where(eq(users.telegramId, tgUser.id));
    }

    await db.insert(events).values({
      userId,
      telegramId: tgUser.id,
      eventType: "app_open",
      metadata: {
        variant: normalizedVariant,
        cid: effectiveCid,
        returning: existing.length > 0,
        ...(storedClientIp ? { ip: storedClientIp } : {}),
      },
      country,
    });

    return NextResponse.json({
      success: true,
      userId,
      variant: normalizedVariant,
      isReturning: existing.length > 0,
      existingSegment: existing[0]?.segment ?? null,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("/api/init error:", message);
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}
