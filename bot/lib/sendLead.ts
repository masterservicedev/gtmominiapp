import type { Api } from "grammy";
import { desc, eq } from "drizzle-orm";
import { db } from "./db";
import { users, events, questionnaireAnswers } from "../../lib/db/schema";
import axios from "axios";
import { voluumPostbackUrl } from "./voluum";
import {
  buildPreApprovalUserMessage,
  buildQualifiedLeadCardText,
} from "../../lib/leadCardContent";

type UserRow = typeof users.$inferSelect;

async function getLatestAnswers(userId: string) {
  const [row] = await db
    .select()
    .from(questionnaireAnswers)
    .where(eq(questionnaireAnswers.userId, userId))
    .orderBy(desc(questionnaireAnswers.createdAt))
    .limit(1);
  return row ?? null;
}

/** Telegram READY fallback — no in-app product block (legacy path). */
export async function sendLeadCard(api: Api, user: UserRow) {
  const answers = await getLatestAnswers(user.id);

  await api.sendMessage(user.telegramId, buildPreApprovalUserMessage(), {
    parse_mode: "Markdown",
  });

  await api.sendMessage(
    user.telegramId,
    buildQualifiedLeadCardText(user, answers, undefined),
  );

  await db
    .update(users)
    .set({ crmTriggered: true, crmTriggeredAt: new Date() })
    .where(eq(users.id, user.id));

  await db.insert(events).values({
    userId: user.id,
    telegramId: user.telegramId,
    eventType: "crm_triggered",
    metadata: { score: user.score, segment: user.segment, source: "telegram_ready" },
    country: user.country,
  });

  if (user.voluumCid && process.env.VOLUUM_POSTBACK_URL) {
    try {
      const url = voluumPostbackUrl(
        process.env.VOLUUM_POSTBACK_URL,
        user.voluumCid,
        "crm_triggered",
      );
      await axios.get(url);
    } catch (e) {
      console.error("Voluum postback failed:", e);
    }
  }
}
