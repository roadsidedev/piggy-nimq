import { Hono } from "hono";
import { z } from "zod";
import { db } from "../db/index.js";
import { recurringSchedules } from "../db/schema.js";
import { eq, and } from "drizzle-orm";
import { nanoid } from "nanoid";
import { authMiddleware, type AppEnv } from "../middleware/auth.js";

const app = new Hono<AppEnv>();
app.use("*", authMiddleware);

const createScheduleSchema = z.object({
  amount: z.string().regex(/^\d+(\.\d{1,6})?$/, "Invalid amount"),
  frequency: z.enum(["weekly", "monthly"]),
  dayOfWeek: z.number().int().min(0).max(6).optional(),
  dayOfMonth: z.number().int().min(1).max(31).optional(),
  goalId: z.string().optional(),
});

const updateScheduleSchema = z.object({
  amount: z.string().regex(/^\d+(\.\d{1,6})?$/).optional(),
  frequency: z.enum(["weekly", "monthly"]).optional(),
  dayOfWeek: z.number().int().min(0).max(6).nullable().optional(),
  dayOfMonth: z.number().int().min(1).max(31).nullable().optional(),
  goalId: z.string().nullable().optional(),
});

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
  const targetDay = dayOfMonth ?? Math.min(now.getDate(), 28);
  const next = new Date(now);
  if (next.getDate() >= targetDay) next.setMonth(next.getMonth() + 1);
  next.setDate(targetDay);
  next.setHours(9, 0, 0, 0);
  return next;
}

function serializeSchedule(s: typeof recurringSchedules.$inferSelect) {
  return {
    ...s,
    createdAt: s.createdAt.toISOString(),
    lastRunAt: s.lastRunAt?.toISOString() ?? null,
    nextRunAt: s.nextRunAt?.toISOString() ?? null,
  };
}

// GET /recurring
app.get("/", async (c) => {
  const userAddress = c.get("userAddress");
  const schedules = await db
    .select()
    .from(recurringSchedules)
    .where(eq(recurringSchedules.userAddress, userAddress))
    .orderBy(recurringSchedules.createdAt);

  return c.json({ success: true, data: schedules.map(serializeSchedule) });
});

// POST /recurring
app.post("/", async (c) => {
  const userAddress = c.get("userAddress");
  const body = await c.req.json();
  const parsed = createScheduleSchema.safeParse(body);

  if (!parsed.success) {
    return c.json(
      { success: false, error: parsed.error.issues[0].message },
      400,
    );
  }

  const { amount, frequency, dayOfWeek, dayOfMonth, goalId } = parsed.data;
  const id = nanoid(21);
  const now = new Date();
  const nextRunAt = computeNextRun(frequency, dayOfWeek, dayOfMonth);

  const [schedule] = await db
    .insert(recurringSchedules)
    .values({
      id,
      userAddress,
      amount,
      frequency,
      dayOfWeek: dayOfWeek ?? null,
      dayOfMonth: dayOfMonth ?? null,
      goalId: goalId ?? null,
      paused: false,
      lastRunAt: null,
      nextRunAt,
      createdAt: now,
    })
    .returning();

  return c.json({ success: true, data: serializeSchedule(schedule) }, 201);
});

// PATCH /recurring/:id
app.patch("/:id", async (c) => {
  const userAddress = c.get("userAddress");
  const scheduleId = c.req.param("id");
  const body = await c.req.json();
  const parsed = updateScheduleSchema.safeParse(body);

  if (!parsed.success) {
    return c.json(
      { success: false, error: parsed.error.issues[0].message },
      400,
    );
  }

  const updates: Record<string, unknown> = {};
  if (parsed.data.amount !== undefined) updates.amount = parsed.data.amount;
  if (parsed.data.frequency !== undefined) updates.frequency = parsed.data.frequency;
  if (parsed.data.dayOfWeek !== undefined) updates.dayOfWeek = parsed.data.dayOfWeek;
  if (parsed.data.dayOfMonth !== undefined) updates.dayOfMonth = parsed.data.dayOfMonth;
  if (parsed.data.goalId !== undefined) updates.goalId = parsed.data.goalId;

  if (parsed.data.frequency || parsed.data.dayOfWeek !== undefined || parsed.data.dayOfMonth !== undefined) {
    const [existing] = await db
      .select()
      .from(recurringSchedules)
      .where(eq(recurringSchedules.id, scheduleId))
      .limit(1);

    if (existing) {
      updates.nextRunAt = computeNextRun(
        (parsed.data.frequency as string) ?? existing.frequency,
        parsed.data.dayOfWeek !== undefined ? parsed.data.dayOfWeek : existing.dayOfWeek,
        parsed.data.dayOfMonth !== undefined ? parsed.data.dayOfMonth : existing.dayOfMonth,
      );
    }
  }

  const [updated] = await db
    .update(recurringSchedules)
    .set(updates)
    .where(
      and(
        eq(recurringSchedules.id, scheduleId),
        eq(recurringSchedules.userAddress, userAddress),
      ),
    )
    .returning();

  if (!updated) {
    return c.json({ success: false, error: "Schedule not found" }, 404);
  }

  return c.json({ success: true, data: serializeSchedule(updated) });
});

// DELETE /recurring/:id
app.delete("/:id", async (c) => {
  const userAddress = c.get("userAddress");
  const scheduleId = c.req.param("id");

  const [deleted] = await db
    .delete(recurringSchedules)
    .where(
      and(
        eq(recurringSchedules.id, scheduleId),
        eq(recurringSchedules.userAddress, userAddress),
      ),
    )
    .returning();

  if (!deleted) {
    return c.json({ success: false, error: "Schedule not found" }, 404);
  }

  return c.json({ success: true });
});

// POST /recurring/:id/toggle
app.post("/:id/toggle", async (c) => {
  const userAddress = c.get("userAddress");
  const scheduleId = c.req.param("id");

  const [existing] = await db
    .select()
    .from(recurringSchedules)
    .where(
      and(
        eq(recurringSchedules.id, scheduleId),
        eq(recurringSchedules.userAddress, userAddress),
      ),
    )
    .limit(1);

  if (!existing) {
    return c.json({ success: false, error: "Schedule not found" }, 404);
  }

  const [updated] = await db
    .update(recurringSchedules)
    .set({ paused: !existing.paused })
    .where(
      and(
        eq(recurringSchedules.id, scheduleId),
        eq(recurringSchedules.userAddress, userAddress),
      ),
    )
    .returning();

  return c.json({ success: true, data: serializeSchedule(updated) });
});

export const recurringRoutes = app;
