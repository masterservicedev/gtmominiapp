import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import {
  getEventsTimelineForUser,
  getUserForAdminLookup,
  parseUserLookupId,
} from "@/lib/admin-queries";
import { getLatestQuestionnaireAnswers } from "@/lib/db/questionnaire";
import { getConversationStatus } from "@/lib/chatwoot";
import { db } from "@/lib/db";
import { broadcastOffers } from "@/lib/db/schema";
import { desc, eq } from "drizzle-orm";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  const denied = requireAdmin(req);
  if (denied) return denied;

  const parsed = parseUserLookupId(params.id);
  if (!parsed) {
    return NextResponse.json(
      { error: "Invalid id — use internal user UUID or numeric Telegram id." },
      { status: 400 },
    );
  }

  const user = await getUserForAdminLookup(parsed);
  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const [questionnaire, timeline, offers] = await Promise.all([
    getLatestQuestionnaireAnswers(user.id),
    getEventsTimelineForUser(user.id, 120),
    db
      .select()
      .from(broadcastOffers)
      .where(eq(broadcastOffers.userId, user.id))
      .orderBy(desc(broadcastOffers.createdAt))
      .limit(24),
  ]);

  let chatwoot: Awaited<ReturnType<typeof getConversationStatus>> = null;
  if (user.chatwootConversationId) {
    chatwoot = await getConversationStatus(user.chatwootConversationId);
  }

  return NextResponse.json({
    user,
    questionnaire,
    timeline,
    broadcastOffers: offers,
    chatwoot,
    generatedAt: new Date().toISOString(),
  });
}
