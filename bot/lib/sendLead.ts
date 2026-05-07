import type { Api } from "grammy";
import { desc, eq } from "drizzle-orm";
import { db } from "./db";
import { users, events, questionnaireAnswers } from "../../lib/db/schema";
import axios from "axios";
import { voluumPostbackUrl } from "./voluum";

function getOfferLine(capital: string, bundleEligible: boolean): string {
  if (!bundleEligible) {
    const standard: Record<string, string> = {
      under_100: "No current offer — channel access only",
      "100_300": "$100 deposit → VIP access",
      "300_1000": "$200 deposit → FX Basics or Education",
      "1000_plus": "$500 deposit → School access",
    };
    return standard[capital] || "See agent for options";
  }

  const bundle: Record<string, string> = {
    under_100: "No current offer — channel access only",
    "100_300": "$100 deposit → VIP + Ebook bundle 🎁",
    "300_1000": "$200 deposit → Pick 1 product + 50% off second 🎁",
    "1000_plus": "$500 deposit → School + 1 product of choice FREE 🎁",
  };
  return bundle[capital] || "See agent for options";
}

function getScoreEmoji(score: number): string {
  if (score >= 5) return "🔴";
  if (score >= 3) return "🟡";
  return "⚪";
}

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

export async function sendLeadCard(api: Api, user: UserRow) {
  const answers = await getLatestAnswers(user.id);
  const capital = answers?.capital ?? "under_100";

  const emoji = getScoreEmoji(user.score || 0);
  const offerLine = getOfferLine(capital, user.bundleEligible ?? false);

  const userMessage = `✅ You've been pre-approved for GTMO Trading access.\n\nA specialist from our team is reviewing your application now.\n\nPlease reply *READY* to confirm you're available to proceed.`;

  await api.sendMessage(user.telegramId, userMessage, {
    parse_mode: "Markdown",
  });

  const leadCard = [
    `[GTMO QUALIFIED LEAD]`,
    ``,
    `Score: ${user.score} ${emoji}`,
    `Capital declared: ${answers?.capital?.replace(/_/g, " ") || "unknown"}`,
    `Experience: ${answers?.experience?.replace(/_/g, " ") || "unknown"}`,
    `Goal: ${answers?.goal?.replace(/_/g, " ") || "unknown"}`,
    `Readiness: ${answers?.readiness?.replace(/_/g, " ") || "unknown"}`,
    ``,
    `Source: ${user.entryVariant || "direct"}`,
    `CID: ${user.voluumCid || "none"}`,
    `Country: ${user.country || "unknown"}`,
    ``,
    `Mini app user: YES`,
    `Bundle eligible: ${user.bundleEligible ? "YES — first deposit" : "NO"}`,
    `Products owned: ${user.productsUnlocked?.length ? user.productsUnlocked.join(", ") : "none"}`,
    ``,
    `→ Offer to lead with: ${offerLine}`,
  ].join("\n");

  await api.sendMessage(user.telegramId, leadCard);

  await db
    .update(users)
    .set({ crmTriggered: true, crmTriggeredAt: new Date() })
    .where(eq(users.id, user.id));

  await db.insert(events).values({
    userId: user.id,
    telegramId: user.telegramId,
    eventType: "crm_triggered",
    metadata: { score: user.score, segment: user.segment },
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
