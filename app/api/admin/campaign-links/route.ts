import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { campaignLinks } from "@/lib/db/schema";
import { desc } from "drizzle-orm";
import { requireAdmin } from "@/lib/admin-auth";

export async function GET(req: NextRequest) {
  const authError = requireAdmin(req);
  if (authError) return authError;

  const links = await db
    .select()
    .from(campaignLinks)
    .orderBy(desc(campaignLinks.createdAt));

  return NextResponse.json({ links });
}

export async function POST(req: NextRequest) {
  const authError = requireAdmin(req);
  if (authError) return authError;

  const body = (await req.json()) as {
    source: string;
    campaign: string;
    startParam: string;
    telegramLink: string;
  };

  if (
    !body.source ||
    !body.campaign ||
    !body.startParam ||
    !body.telegramLink
  ) {
    return NextResponse.json(
      { error: "Missing required fields" },
      { status: 400 },
    );
  }

  const [link] = await db
    .insert(campaignLinks)
    .values({
      source: body.source,
      campaign: body.campaign,
      startParam: body.startParam,
      telegramLink: body.telegramLink,
    })
    .returning();

  return NextResponse.json({ link });
}
