import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { addChatwootNote } from "@/lib/chatwoot";
import { getLatestQuestionnaireAnswers } from "@/lib/db/questionnaire";

function extractTelegramId(payload: Record<string, unknown>): number | null {
  const meta = payload.meta as Record<string, unknown> | undefined;
  const sender = (meta?.sender ??
    (payload.sender as Record<string, unknown>)) as
    | Record<string, unknown>
    | undefined;
  const idRaw =
    sender?.identifier ??
    (payload.conversation as Record<string, unknown> | undefined)?.[
      "contact_inbox"
    ];
  if (typeof idRaw === "string" || typeof idRaw === "number") {
    const n = parseInt(String(idRaw).replace(/\D/g, ""), 10);
    return Number.isFinite(n) ? n : null;
  }
  return null;
}

function extractConversationId(
  payload: Record<string, unknown>,
): string | null {
  const conv = payload.conversation as Record<string, unknown> | undefined;
  const id = conv?.id ?? payload.id;
  if (id === undefined || id === null) return null;
  return String(id);
}

export async function POST(req: NextRequest) {
  try {
    const payload = (await req.json()) as Record<string, unknown>;
    const event = String(payload.event || "");

    if (!["conversation_created", "message_created"].includes(event)) {
      return NextResponse.json({ ok: true });
    }

    const telegramId = extractTelegramId(payload);
    if (!telegramId) {
      return NextResponse.json({ ok: true });
    }

    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.telegramId, telegramId))
      .limit(1);

    if (!user || !user.miniAppUser) {
      return NextResponse.json({ ok: true });
    }

    const conversationId = extractConversationId(payload);
    if (!conversationId) return NextResponse.json({ ok: true });

    const latest = await getLatestQuestionnaireAnswers(user.id);
    const daysSince = Math.floor(
      (Date.now() - new Date(user.createdAt!).getTime()) / (1000 * 60 * 60 * 24),
    );

    const note = [
      `⚡ RETURNING MINI APP USER`,
      ``,
      `Originally qualified: ${daysSince} days ago`,
      `Score at entry: ${user.score} (${user.segment})`,
      `Capital declared: ${latest?.capital ?? "see DB"}`,
      `Entry variant: ${user.entryVariant || "unknown"}`,
      `Source CID: ${user.voluumCid || "none"}`,
      `Products owned: ${user.productsUnlocked?.join(", ") || "none"}`,
      `Bundle eligible: ${user.bundleEligible && !user.bundleUsed ? "YES — first deposit" : "NO"}`,
    ].join("\n");

    await addChatwootNote(conversationId, note);

    return NextResponse.json({ ok: true });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("Chatwoot webhook error:", message);
    return NextResponse.json({ ok: true });
  }
}
