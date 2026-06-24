import { Hono } from "hono";
import { z } from "zod";
import { db } from "../db/index.js";
import { goals } from "../db/schema.js";
import { eq, and } from "drizzle-orm";
import { nanoid } from "nanoid";
import { authMiddleware, type AppEnv } from "../middleware/auth.js";

const app = new Hono<AppEnv>();
app.use("*", authMiddleware);

const createGoalSchema = z.object({
  title: z.string().min(1).max(100),
  targetAmount: z.string().regex(/^\d+(\.\d{1,6})?$/, "Invalid amount"),
  targetDate: z.string().datetime().optional(),
});

const updateGoalSchema = z.object({
  title: z.string().min(1).max(100).optional(),
  targetAmount: z.string().regex(/^\d+(\.\d{1,6})?$/).optional(),
  targetDate: z.string().datetime().nullable().optional(),
});

const allocateSchema = z.object({
  amount: z.string().regex(/^\d+(\.\d{1,6})?$/, "Invalid amount"),
});

const transferSchema = z.object({
  toGoalId: z.string().min(1),
  amount: z.string().regex(/^\d+(\.\d{1,6})?$/, "Invalid amount"),
});

function serializeGoal(g: typeof goals.$inferSelect) {
  return {
    ...g,
    createdAt: g.createdAt.toISOString(),
    updatedAt: g.updatedAt.toISOString(),
    targetDate: g.targetDate?.toISOString() ?? null,
  };
}

// GET /goals
app.get("/", async (c) => {
  const userAddress = c.get("userAddress");
  const userGoals = await db
    .select()
    .from(goals)
    .where(eq(goals.userAddress, userAddress))
    .orderBy(goals.createdAt);

  return c.json({
    success: true,
    data: userGoals.map(serializeGoal),
  });
});

// POST /goals
app.post("/", async (c) => {
  const userAddress = c.get("userAddress");
  const body = await c.req.json();
  const parsed = createGoalSchema.safeParse(body);

  if (!parsed.success) {
    return c.json(
      { success: false, error: parsed.error.issues[0].message },
      400,
    );
  }

  const { title, targetAmount, targetDate } = parsed.data;
  const id = nanoid(21);
  const now = new Date();

  const [goal] = await db
    .insert(goals)
    .values({
      id,
      userAddress,
      title,
      targetAmount,
      currentAmount: "0",
      targetDate: targetDate ? new Date(targetDate) : null,
      createdAt: now,
      updatedAt: now,
    })
    .returning();

  return c.json({ success: true, data: serializeGoal(goal) }, 201);
});

// PATCH /goals/:id
app.patch("/:id", async (c) => {
  const userAddress = c.get("userAddress");
  const goalId = c.req.param("id");
  const body = await c.req.json();
  const parsed = updateGoalSchema.safeParse(body);

  if (!parsed.success) {
    return c.json(
      { success: false, error: parsed.error.issues[0].message },
      400,
    );
  }

  const updates: Record<string, unknown> = { updatedAt: new Date() };
  if (parsed.data.title !== undefined) updates.title = parsed.data.title;
  if (parsed.data.targetAmount !== undefined)
    updates.targetAmount = parsed.data.targetAmount;
  if (parsed.data.targetDate !== undefined)
    updates.targetDate = parsed.data.targetDate
      ? new Date(parsed.data.targetDate)
      : null;

  const [updated] = await db
    .update(goals)
    .set(updates)
    .where(and(eq(goals.id, goalId), eq(goals.userAddress, userAddress)))
    .returning();

  if (!updated) {
    return c.json({ success: false, error: "Goal not found" }, 404);
  }

  return c.json({ success: true, data: serializeGoal(updated) });
});

// DELETE /goals/:id
app.delete("/:id", async (c) => {
  const userAddress = c.get("userAddress");
  const goalId = c.req.param("id");

  const [deleted] = await db
    .delete(goals)
    .where(and(eq(goals.id, goalId), eq(goals.userAddress, userAddress)))
    .returning();

  if (!deleted) {
    return c.json({ success: false, error: "Goal not found" }, 404);
  }

  return c.json({ success: true });
});

// POST /goals/:id/allocate
app.post("/:id/allocate", async (c) => {
  const userAddress = c.get("userAddress");
  const goalId = c.req.param("id");
  const body = await c.req.json();
  const parsed = allocateSchema.safeParse(body);

  if (!parsed.success) {
    return c.json(
      { success: false, error: parsed.error.issues[0].message },
      400,
    );
  }

  const [goal] = await db
    .select()
    .from(goals)
    .where(and(eq(goals.id, goalId), eq(goals.userAddress, userAddress)))
    .limit(1);

  if (!goal) {
    return c.json({ success: false, error: "Goal not found" }, 404);
  }

  const current = Math.round(Number(goal.currentAmount) * 1e6);
  const add = Math.round(Number(parsed.data.amount) * 1e6);
  const newAmount = ((current + add) / 1e6).toFixed(6);

  const [updated] = await db
    .update(goals)
    .set({ currentAmount: newAmount, updatedAt: new Date() })
    .where(and(eq(goals.id, goalId), eq(goals.userAddress, userAddress)))
    .returning();

  return c.json({ success: true, data: serializeGoal(updated) });
});

// POST /goals/:id/transfer
app.post("/:id/transfer", async (c) => {
  const userAddress = c.get("userAddress");
  const fromGoalId = c.req.param("id");
  const body = await c.req.json();
  const parsed = transferSchema.safeParse(body);

  if (!parsed.success) {
    return c.json(
      { success: false, error: parsed.error.issues[0].message },
      400,
    );
  }

  const { toGoalId, amount } = parsed.data;
  if (fromGoalId === toGoalId) {
    return c.json(
      { success: false, error: "Cannot transfer to the same goal" },
      400,
    );
  }

  const [fromGoal] = await db
    .select()
    .from(goals)
    .where(and(eq(goals.id, fromGoalId), eq(goals.userAddress, userAddress)))
    .limit(1);

  const [toGoal] = await db
    .select()
    .from(goals)
    .where(and(eq(goals.id, toGoalId), eq(goals.userAddress, userAddress)))
    .limit(1);

  if (!fromGoal || !toGoal) {
    return c.json(
      { success: false, error: "One or both goals not found" },
      404,
    );
  }

  const transferAmount = Math.round(Number(amount) * 1e6);
  const fromCurrent = Math.round(Number(fromGoal.currentAmount) * 1e6);
  const toCurrent = Math.round(Number(toGoal.currentAmount) * 1e6);

  if (fromCurrent < transferAmount) {
    return c.json(
      { success: false, error: "Insufficient funds in source goal" },
      400,
    );
  }

  const newFromAmount = ((fromCurrent - transferAmount) / 1e6).toFixed(6);
  const newToAmount = ((toCurrent + transferAmount) / 1e6).toFixed(6);

  await Promise.all([
    db
      .update(goals)
      .set({ currentAmount: newFromAmount, updatedAt: new Date() })
      .where(eq(goals.id, fromGoalId)),
    db
      .update(goals)
      .set({ currentAmount: newToAmount, updatedAt: new Date() })
      .where(eq(goals.id, toGoalId)),
  ]);

  return c.json({ success: true });
});

export const goalRoutes = app;
