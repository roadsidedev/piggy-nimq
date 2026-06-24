import { db } from "../db/index.js";
import { recurringSchedules, goals } from "../db/schema.js";
import { eq, and, lte, isNull } from "drizzle-orm";

interface ReminderResult {
  scheduleId: string;
  userAddress: string;
  amount: string;
  frequency: string;
}

export async function checkRecurringSchedules(): Promise<ReminderResult[]> {
  const now = new Date();
  const results: ReminderResult[] = [];

  // Find all active schedules where next_run_at is due
  const dueSchedules = await db
    .select()
    .from(recurringSchedules)
    .where(
      and(
        eq(recurringSchedules.paused, false),
        lte(recurringSchedules.nextRunAt, now),
      ),
    );

  for (const schedule of dueSchedules) {
    results.push({
      scheduleId: schedule.id,
      userAddress: schedule.userAddress,
      amount: schedule.amount,
      frequency: schedule.frequency,
    });

    // Compute next run
    const nextRun = computeNextRun(
      schedule.frequency,
      schedule.dayOfWeek,
      schedule.dayOfMonth,
    );

    // Update the schedule with new next_run_at and last_run_at
    await db
      .update(recurringSchedules)
      .set({
        lastRunAt: now,
        nextRunAt: nextRun,
      })
      .where(eq(recurringSchedules.id, schedule.id));

    // If linked to a goal, update the current_amount
    if (schedule.goalId) {
      const [goal] = await db
        .select()
        .from(goals)
        .where(eq(goals.id, schedule.goalId))
        .limit(1);

      if (goal) {
        const current = Math.round(Number(goal.currentAmount) * 1e6);
        const add = Math.round(Number(schedule.amount) * 1e6);
        const newAmount = ((current + add) / 1e6).toFixed(6);

        await db
          .update(goals)
          .set({ currentAmount: newAmount, updatedAt: now })
          .where(eq(goals.id, schedule.goalId));
      }
    }
  }

  return results;
}

function computeNextRun(
  frequency: string,
  dayOfWeek?: number | null,
  dayOfMonth?: number | null,
): Date {
  const now = new Date();

  if (frequency === "weekly") {
    const targetDay = dayOfWeek ?? now.getDay();
    const daysUntil = (targetDay - now.getDay() + 7) % 7 || 7;
    const next = new Date(now);
    next.setDate(next.getDate() + daysUntil);
    next.setHours(9, 0, 0, 0);
    return next;
  }

  // Monthly
  const targetDay = dayOfMonth ?? Math.min(now.getDate(), 28);
  const next = new Date(now);
  if (next.getDate() >= targetDay) {
    next.setMonth(next.getMonth() + 1);
  }
  next.setDate(targetDay);
  next.setHours(9, 0, 0, 0);
  return next;
}
