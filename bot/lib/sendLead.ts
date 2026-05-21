import type { Api } from "grammy";
import { desc, eq } from "drizzle-orm";
import { db } from "./db";
import { users, events, questionnaireAnswers } from "../../lib/db/schema";
import axios from "axios";
import { voluumPostbackUrl } from "./voluum";
import {
  buildCustomerHandoffMessage,
  capitalFromAnswers,
} from "../../lib/leadCardContent";
import { getProductMatch } from "../../lib/productMatch";
import { attachInternalLeadToChatwoot } from "../../lib/handoffHighIntent";
import { scheduleHighNurture } from "../../lib/nurtureSchedule";

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

/** Telegram READY fallback — customer DM + Chatwoot private note with internal card. */
export async function sendLeadCard(api: Api, user: UserRow) {
  const crmWasNew = !user.crmTriggered;
  const answers = await getLatestAnswers(user.id);

  await api.sendMessage(
    user.telegramId,
    buildCustomerHandoffMessage(user, answers, undefined),
    { parse_mode: "Markdown" },
  );

  const cap = capitalFromAnswers(answers?.capital);
  const pm = getProductMatch(
    cap,
    user.bundleEligible ?? false,
    user.bundleUsed ?? false,
  );

  await attachInternalLeadToChatwoot(
    user.telegramId,
    pm.productKey,
    user,
    answers,
    undefined,
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

  if (crmWasNew && user.segment === "HIGH") {
    await scheduleHighNurture(user.id, user.telegramId, new Date());
  }
}
