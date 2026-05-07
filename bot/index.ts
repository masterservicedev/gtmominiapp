import { Bot } from "grammy";
import { handleStart } from "./handlers/start";
import { handleMessage } from "./handlers/messages";
import { processNurtureQueue } from "./lib/nurture";
import "dotenv/config";

const bot = new Bot(process.env.TELEGRAM_BOT_TOKEN!);

bot.command("start", handleStart);
bot.on("message:text", handleMessage);

bot.catch((err) => {
  console.error("Bot error:", err);
});

setInterval(async () => {
  await processNurtureQueue(bot);
}, 5 * 60 * 1000);

bot.start();
console.log("GTMO bot running");
