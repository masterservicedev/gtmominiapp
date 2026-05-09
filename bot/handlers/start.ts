import type { Context } from "grammy";
import { db } from "../lib/db";
import { users } from "../../lib/db/schema";
import { eq } from "drizzle-orm";
import { getMiniAppUrl } from "../lib/config";

export async function handleStart(ctx: Context) {
  const telegramId = ctx.from?.id;
  if (!telegramId) return;

  const startParam = typeof ctx.match === "string" ? ctx.match.trim() : "";
  const isReferral = startParam.startsWith("ref_");
  const referrerId = isReferral ? startParam.replace("ref_", "") : null;

  const existing = await db
    .select()
    .from(users)
    .where(eq(users.telegramId, telegramId))
    .limit(1);

  if (existing.length === 0 && referrerId) {
    console.log(`Referral: ${telegramId} referred by ${referrerId}`);
  }

  const miniAppUrl = getMiniAppUrl();
  const text =
    "👋 Welcome to GTMO Trading.\n\nTap below to apply for access to our live trading signals.";

  if (!miniAppUrl) {
    await ctx.reply(
      `${text}\n\n⚠️ Mini app URL is not configured. Set MINI_APP_URL on the server (https://your-app.vercel.app).`,
    );
    return;
  }

  await ctx.reply(text, {
    reply_markup: {
      inline_keyboard: [
        [{ text: "🚀 Apply Now", web_app: { url: miniAppUrl } }],
      ],
    },
  });
}
