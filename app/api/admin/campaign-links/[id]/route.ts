import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { campaignLinks } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { requireAdmin } from "@/lib/admin-auth";

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  const authError = requireAdmin(req);
  if (authError) return authError;

  await db.delete(campaignLinks).where(eq(campaignLinks.id, params.id));

  return NextResponse.json({ ok: true });
}
