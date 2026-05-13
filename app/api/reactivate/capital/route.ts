import { NextRequest, NextResponse } from "next/server";
import { validateInitData } from "@/lib/validation";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { updateLatestQuestionnaireCapital } from "@/lib/reactivateHandoff";
import type { Capital } from "@/lib/scoring";

const CAPITALS: Capital[] = [
  "under_100",
  "100_300",
  "300_1000",
  "1000_plus",
];

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as {
      initData: string;
      capital: string;
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

    if (!CAPITALS.includes(body.capital as Capital)) {
      return NextResponse.json({ error: "Invalid capital" }, { status: 400 });
    }

    const ok = await updateLatestQuestionnaireCapital(
      user.id,
      body.capital as Capital,
    );
    if (!ok) {
      return NextResponse.json(
        { error: "No questionnaire row to update" },
        { status: 400 },
      );
    }

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}
