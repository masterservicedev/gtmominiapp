/**
 * Legacy inbound bot handler.
 *
 * Not used while Chatwoot owns Telegram webhook/inbound.
 * Current Railway bot entrypoint is bot/index.ts, which runs outbound nurture only.
 *
 * Keep as reference only unless inbound handling is intentionally moved back from Chatwoot.
 */

import type { Context } from "grammy";
import { db } from "../lib/db";
import { users } from "../../lib/db/schema";
import { eq } from "drizzle-orm";
import { getMiniAppWebAppUrl } from "../lib/config";

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

  const startPayload =
    typeof ctx.match === "string" ? ctx.match.trim() : "";
  const miniAppUrl = getMiniAppWebAppUrl(
    startPayload && !startPayload.startsWith("ref_") ? startPayload : null,
  );
  const text =
    "Every setup is called before the positions are opened.\n10,000+ members inside.\nIntake is limited. Applications are reviewed in rounds.";

  if (!miniAppUrl) {
    await ctx.reply(
      `${text}\n\n⚠️ Mini app URL is not configured. Set MINI_APP_URL on the server (https://your-app.vercel.app).`,
    );
    return;
  }

  await ctx.reply(text, {
    reply_markup: {
      inline_keyboard: [
        [{ text: "Apply for Access", web_app: { url: miniAppUrl } }],
      ],
    },
  });
}
