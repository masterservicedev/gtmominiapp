import type { Bot } from "grammy";
import { db } from "./db";
import { nurtureQueue, users } from "../../lib/db/schema";
import { eq, lte, and } from "drizzle-orm";

const nurtureMessages = [
  (firstName: string) =>
    `Hey ${firstName}, you're now inside GTMO Trading signals.\n\nThe channel is live every day with real trade setups. Have a look around and see what we're doing. 👀`,

  (firstName: string) =>
    `${firstName}, just checking in.\n\nIf you've been watching the channel, you'll have seen the kind of setups we run. When you're ready to go deeper, tap below to get started with a funded account. 📈`,

  (firstName: string) =>
    `Last message from us for now, ${firstName}.\n\nIf the timing is right and you're ready to start — our team is available to walk you through everything step by step.\n\nReply *READY* and we'll connect you now.`,
];

export async function processNurtureQueue(bot: Bot) {
  const now = new Date();

  const pending = await db
    .select()
    .from(nurtureQueue)
    .where(
      and(
        eq(nurtureQueue.status, "pending"),
        lte(nurtureQueue.scheduledAt, now),
      ),
    );

  for (const item of pending) {
    try {
      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.id, item.userId))
        .limit(1);

      if (!user) continue;

      if (user.crmTriggered) {
        await db
          .update(nurtureQueue)
          .set({ status: "cancelled" })
          .where(eq(nurtureQueue.id, item.id));
        continue;
      }

      const template = nurtureMessages[item.step];
      if (!template) continue;

      const message = template(user.firstName || "there");

      await bot.api.sendMessage(user.telegramId, message, {
        parse_mode: "Markdown",
      });

      await db
        .update(nurtureQueue)
        .set({ status: "sent", sentAt: new Date() })
        .where(eq(nurtureQueue.id, item.id));
    } catch (err) {
      console.error(`Nurture send failed for ${item.userId}:`, err);
    }
  }
}
