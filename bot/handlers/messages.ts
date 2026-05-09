import type { Context } from "grammy";
import { db } from "../lib/db";
import { users, events } from "../../lib/db/schema";
import { eq } from "drizzle-orm";
import { sendLeadCard } from "../lib/sendLead";
import { getMiniAppUrl } from "../lib/config";

export async function handleMessage(ctx: Context) {
  const telegramId = ctx.from?.id;
  const text = ctx.message?.text?.toLowerCase().trim();
  if (!telegramId || !text) return;

  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.telegramId, telegramId))
    .limit(1);

  const miniAppUrl = getMiniAppUrl();

  if (!user) {
    const msg = "To get started, please complete your application first.";
    if (!miniAppUrl) {
      await ctx.reply(
        `${msg}\n\n⚠️ MINI_APP_URL is not set on the server.`,
      );
      return;
    }
    await ctx.reply(msg, {
      reply_markup: {
        inline_keyboard: [
          [{ text: "📋 Apply Now", web_app: { url: miniAppUrl } }],
        ],
      },
    });
    return;
  }

  if (text === "ready" && user.segment === "HIGH" && !user.crmTriggered) {
    await sendLeadCard(ctx.api, user);
    return;
  }

  if (user.segment === "MID") {
    await db.insert(events).values({
      userId: user.id,
      telegramId: user.telegramId,
      eventType: "rescore",
      metadata: { trigger: "bot_reply", message: text },
      country: user.country,
    });

    const newScore = (user.score || 0) + 1;
    if (newScore >= 5) {
      await db
        .update(users)
        .set({ score: newScore, segment: "HIGH" })
        .where(eq(users.id, user.id));

      const [updated] = await db
        .select()
        .from(users)
        .where(eq(users.id, user.id))
        .limit(1);

      if (updated) {
        await sendLeadCard(ctx.api, updated);
      }
    }
    return;
  }

  if (!miniAppUrl) {
    await ctx.reply(
      "Tap below to continue your application.\n\n⚠️ MINI_APP_URL is not set on the server.",
    );
    return;
  }

  await ctx.reply("Tap below to continue your application.", {
    reply_markup: {
      inline_keyboard: [
        [{ text: "📋 Open App", web_app: { url: miniAppUrl } }],
      ],
    },
  });
}
