import { db } from "./db/index.js";
import { env } from "./env.js";
import { checkRecurringSchedules } from "./services/recurring.js";

async function runCron() {
  console.log(`[CRON] Starting recurring check at ${new Date().toISOString()}`);

  try {
    const reminders = await checkRecurringSchedules();
    console.log(`[CRON] Processed ${reminders.length} due schedules`);

    for (const r of reminders) {
      console.log(
        `  -> ${r.userAddress}: ${r.amount} USDT (${r.frequency})`,
      );
    }
  } catch (err) {
    console.error("[CRON] Error:", err);
    process.exit(1);
  }

  console.log("[CRON] Done");
}

runCron();
