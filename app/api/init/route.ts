import { appendFileSync } from "fs";
import { NextRequest, NextResponse } from "next/server";
import { validateInitData } from "@/lib/validation";
import { db } from "@/lib/db";
import { users, events, offers } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import axios from "axios";
import { normalizeEntryVariant } from "@/lib/funnel/normalize";

const DEBUG_FUNNEL_LOG =
  "/Users/ohmz/Desktop/GTMO_miniapp/.cursor/debug-22219e.log";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { initData, voluumCid, entryVariant } = body;

    const { user: tgUser } = validateInitData(initData);

    const ip =
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      req.headers.get("x-real-ip") ||
      "0.0.0.0";

    let country: string | null = null;
    let countryCode: string | null = null;
    try {
      const geo = await axios.get(`https://ipapi.co/${ip}/json/`, {
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

    /** Opened from bot/link with ?startapp= (Telegram passes start_param). */
    let variant: string | null | undefined = fromClient;
    let resolutionSource:
      | "client"
      | "fallback_empty_offers"
      | "sticky"
      | "random" = "client";

    if (!variant) {
      if (activeOffers.length === 0) {
        /** No active offers: do NOT use sticky user row (ops cleared rotation). */
        const fb = process.env.FUNNEL_FALLBACK_VARIANT?.trim();
        variant = fb || "ad4";
        resolutionSource = "fallback_empty_offers";
      } else if (existing.length > 0 && existing[0]!.entryVariant) {
        variant = existing[0]!.entryVariant;
        resolutionSource = "sticky";
      } else {
        variant =
          activeOffers[Math.floor(Math.random() * activeOffers.length)]!.name;
        resolutionSource = "random";
      }
    }

    const normalizedVariant = normalizeEntryVariant(variant);

    // #region agent log
    try {
      appendFileSync(
        DEBUG_FUNNEL_LOG,
        `${JSON.stringify({
          sessionId: "22219e",
          hypothesisId: "H_sticky_vs_empty_offers",
          location: "app/api/init/route.ts",
          message: "variant resolved",
          data: {
            activeOffersCount: activeOffers.length,
            resolutionSource,
            variantRaw: variant ?? null,
            normalizedVariant,
            returning: existing.length > 0,
            hadStoredVariant: Boolean(existing[0]?.entryVariant),
          },
          timestamp: Date.now(),
        })}\n`,
      );
    } catch {
      /* ignore — e.g. read-only prod FS */
    }
    // #endregion

    let userId: string;

    if (existing.length === 0) {
      const [newUser] = await db
        .insert(users)
        .values({
          telegramId: tgUser.id,
          username: tgUser.username || null,
          firstName: tgUser.first_name || null,
          languageCode: tgUser.language_code || null,
          voluumCid: voluumCid || null,
          entryVariant: normalizedVariant,
          country,
          countryCode,
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
          ...(fromClient
            ? {
                entryVariant: normalizedVariant,
                ...(voluumCid ? { voluumCid } : {}),
              }
            : activeOffers.length === 0
              ? { entryVariant: normalizedVariant }
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
        cid: voluumCid,
        returning: existing.length > 0,
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
