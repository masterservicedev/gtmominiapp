import { NextRequest, NextResponse } from "next/server";
import { validateInitData } from "@/lib/validation";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import {
  parseReactivateOfferId,
  confirmReactivationHandoff,
} from "@/lib/reactivateHandoff";
import {
  findLatestReEngagementBroadcastSent,
  logBroadcastReply,
} from "@/lib/broadcastAttribution";

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as {
      initData: string;
      offerId?: string | null;
    };
    const v = validateInitData(body.initData);
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.telegramId, v.user.id))
      .limit(1);

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const offerId =
      (typeof body.offerId === "string" && body.offerId) ||
      parseReactivateOfferId(v.startParam);

    const result = await confirmReactivationHandoff(user, offerId);
    if (!result.ok) {
      if (result.error === "already_deposited") {
        return NextResponse.json(
          { error: "already_deposited", message: "You're already active." },
          { status: 400 },
        );
      }
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    const last = await findLatestReEngagementBroadcastSent(user.id);
    if (last) {
      await logBroadcastReply(
        user.id,
        user.telegramId,
        last,
        "mini_app_reactivate_confirm",
        user.country,
      );
    }

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}
