import { Hono } from "hono";
import { z } from "zod";
import { db } from "../db/index.js";
import { analyticsEvents, errorLogs } from "../db/schema.js";
import { gte, sql } from "drizzle-orm";
import { rateLimit } from "../middleware/rateLimit.js";

const app = new Hono();

const analyticsSchema = z.object({
  event: z.string().min(1),
  data: z.record(z.string(), z.unknown()).optional(),
  timestamp: z.string().optional(),
  url: z.string().optional(),
});

const errorLogSchema = z.object({
  error: z.object({
    name: z.string(),
    message: z.string(),
    stack: z.string().optional(),
  }),
  context: z.record(z.string(), z.unknown()).optional(),
  timestamp: z.string().optional(),
});

// POST /api/analytics
app.post(
  "/analytics",
  rateLimit({ windowMs: 60_000, max: 60 }),
  async (c) => {
    const body = await c.req.json();
    const parsed = analyticsSchema.safeParse(body);

    if (!parsed.success) {
      return c.json({ success: false, error: "Invalid payload" }, 400);
    }

    await db.insert(analyticsEvents).values({
      event: parsed.data.event,
      data: parsed.data.data ?? {},
      url: parsed.data.url ?? null,
    });

    return c.json({ success: true });
  },
);

// POST /api/log
app.post(
  "/log",
  rateLimit({ windowMs: 60_000, max: 30 }),
  async (c) => {
    const body = await c.req.json();
    const parsed = errorLogSchema.safeParse(body);

    if (!parsed.success) {
      return c.json({ success: false, error: "Invalid payload" }, 400);
    }

    await db.insert(errorLogs).values({
      errorName: parsed.data.error.name,
      errorMessage: parsed.data.error.message,
      stack: parsed.data.error.stack ?? null,
      context: parsed.data.context ?? {},
    });

    return c.json({ success: true });
  },
);

// GET /api/analytics/stats
app.get("/analytics/stats", async (c) => {
  const days = Number(c.req.query("days") ?? "7");
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

  const events = await db
    .select({
      event: analyticsEvents.event,
      count: sql<number>`count(*)::int`,
    })
    .from(analyticsEvents)
    .where(gte(analyticsEvents.createdAt, since))
    .groupBy(analyticsEvents.event);

  const [errorCount] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(errorLogs)
    .where(gte(errorLogs.createdAt, since));

  return c.json({
    success: true,
    data: {
      period: `${days}d`,
      events,
      totalErrors: errorCount?.count ?? 0,
    },
  });
});

export const analyticsRoutes = app;
