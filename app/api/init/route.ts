import { NextRequest, NextResponse } from "next/server";
import { validateInitData } from "@/lib/validation";
import { db } from "@/lib/db";
import { users, events, offers } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { normalizeEntryVariant } from "@/lib/funnel/normalize";
import { parseStartParam } from "@/lib/startParam";
import { getClientIpRaw, normalizeStoredClientIp } from "@/lib/client-ip";
import { syncTelegramInbox977TriageForUser } from "@/lib/chatwootInboxTriage";
import {
  getUnconsumedTelegramStartAttribution,
  hasStructuredAttribution,
  markTelegramStartAttributionConsumed,
} from "@/lib/telegramStartAttribution";

function scheduleTelegramInboxTriageSync(userId: string): void {
  void (async () => {
    try {
      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.id, userId))
        .limit(1);
      if (!user) return;
      await syncTelegramInbox977TriageForUser(user);
    } catch (err: unknown) {
      console.error("[init] telegram inbox triage sync failed", {
        userId,
        error: err instanceof Error ? err.message : String(err),
      });
    }
  })();
}

function scheduleGeoUpdate(userId: string, ipForGeo: string): void {
  void (async () => {
    try {
      if (!ipForGeo || ipForGeo === "0.0.0.0") {
        console.warn("[geo] invalid ip for lookup", { ip: ipForGeo });
      }
      console.log("[geo] lookup start", { ip: ipForGeo });

      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 2000);
      const geo = await fetch(`https://ipapi.co/${ipForGeo}/json/`, {
        signal: controller.signal,
      });
      clearTimeout(timeout);

      const rawBody = await geo.text();

      if (!geo.ok) {
        console.error("[geo] ipapi error", {
          ip: ipForGeo,
          status: geo.status,
          body: rawBody,
        });
        return;
      }

      let payload: unknown;
      try {
        payload = JSON.parse(rawBody);
      } catch (err: unknown) {
        console.error("[geo] json parse failed", {
          ip: ipForGeo,
          body: rawBody,
          error: err instanceof Error ? err.message : String(err),
        });
        return;
      }

      const geoData = payload as {
        country_name?: string;
        country_code?: string;
      };
      const country = geoData.country_name ?? null;
      const countryCode = geoData.country_code ?? null;

      if (!country && !countryCode) {
        console.warn("[geo] empty response", {
          ip: ipForGeo,
          body: rawBody,
        });
        return;
      }

      console.log("[geo] ok", {
        ip: ipForGeo,
        country,
        countryCode,
      });

      await db
        .update(users)
        .set({
          ...(country ? { country } : {}),
          ...(countryCode ? { countryCode } : {}),
        })
        .where(eq(users.id, userId));
    } catch (err: unknown) {
      console.error("[geo] fetch failed", {
        ip: ipForGeo,
        error: err instanceof Error ? err.message : String(err),
      });
    }
  })();
}

function isAuthValidationError(message: string): boolean {
  return (
    message.includes("Invalid") ||
    message.includes("Unauthorized") ||
    message.includes("hash") ||
    message.includes("expired") ||
    message.includes("Missing")
  );
}

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

    let usedPendingStartAttribution = false;
    let startParam = validatedStartParam.trim();
    if (!hasStructuredAttribution(parseStartParam(startParam))) {
      const pending = await getUnconsumedTelegramStartAttribution(tgUser.id);
      if (pending) {
        startParam = pending.rawStartParam;
        usedPendingStartAttribution = true;
        console.log("[init] using pending /start attribution", {
          telegramId: tgUser.id,
          rawStartParam: pending.rawStartParam,
        });
      } else if (!startParam && bodyStart.trim()) {
        startParam = bodyStart.trim();
      }
    }

    /** Authoritative parse of Telegram `start_param` (signed Mini App or pending /start). */
    const parsed = parseStartParam(startParam);

    const fromBodyCid =
      typeof voluumCid === "string" && voluumCid.trim()
        ? voluumCid.trim()
        : null;
    const fromParsedCid = parsed.cid?.trim() || null;
    /** Prefer parsed `start_param` cid over body when present (campaign links). */
    const effectiveCid = fromParsedCid ?? fromBodyCid;

    const ipRaw = getClientIpRaw(req);
    const ipForGeo = ipRaw || "0.0.0.0";
    const storedClientIp = normalizeStoredClientIp(ipRaw);

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
          lastSeenIp: storedClientIp,
          ...(hasIncomingAttribution
            ? {
                ...utmPatch,
                ...(effectiveCid ? { voluumCid: effectiveCid } : {}),
              }
            : {}),
        })
        .where(eq(users.telegramId, tgUser.id));
    }

    if (usedPendingStartAttribution) {
      await markTelegramStartAttributionConsumed(tgUser.id);
    }

    await db.insert(events).values({
      userId,
      telegramId: tgUser.id,
      eventType: "app_open",
      metadata: {
        variant: normalizedVariant,
        cid: effectiveCid,
        returning: existing.length > 0,
        ...(usedPendingStartAttribution
          ? { attributionSource: "pending_start" }
          : {}),
        ...(storedClientIp ? { ip: storedClientIp } : {}),
      },
    });

    scheduleGeoUpdate(userId, ipForGeo);
    scheduleTelegramInboxTriageSync(userId);

    return NextResponse.json({
      success: true,
      userId,
      variant: normalizedVariant,
      isReturning: existing.length > 0,
      existingSegment: existing[0]?.segment ?? null,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);

    if (isAuthValidationError(message)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    console.error("[init] unexpected error:", message);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
