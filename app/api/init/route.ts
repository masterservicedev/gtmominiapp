import { NextRequest, NextResponse } from "next/server";
import { validateInitData } from "@/lib/validation";
import { db } from "@/lib/db";
import { users, events, offers } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import axios from "axios";

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

    let variant: string | null | undefined = entryVariant;
    if (!variant) {
      const activeOffers = await db
        .select()
        .from(offers)
        .where(eq(offers.active, true));

      if (activeOffers.length > 0) {
        variant =
          activeOffers[Math.floor(Math.random() * activeOffers.length)]!.name;
      }
    }

    const existing = await db
      .select()
      .from(users)
      .where(eq(users.telegramId, tgUser.id))
      .limit(1);

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
          entryVariant: variant || null,
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
        .set({ lastSeenAt: new Date() })
        .where(eq(users.telegramId, tgUser.id));
    }

    await db.insert(events).values({
      userId,
      telegramId: tgUser.id,
      eventType: "app_open",
      metadata: { variant, cid: voluumCid, returning: existing.length > 0 },
      country,
    });

    return NextResponse.json({
      success: true,
      userId,
      variant: variant || "default",
      isReturning: existing.length > 0,
      existingSegment: existing[0]?.segment ?? null,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("/api/init error:", message);
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}
