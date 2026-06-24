import { Hono } from "hono";
import { z } from "zod";
import { db } from "../db/index.js";
import { transactions } from "../db/schema.js";
import { eq, and, desc, sql } from "drizzle-orm";
import { nanoid } from "nanoid";
import { authMiddleware, type AppEnv } from "../middleware/auth.js";

const app = new Hono<AppEnv>();
app.use("*", authMiddleware);

const createTransactionSchema = z.object({
  type: z.enum(["deposit", "withdraw", "borrow", "repay", "yield"]),
  amount: z.string().regex(/^\d+(\.\d{1,6})?$/, "Invalid amount"),
  txHash: z.string().regex(/^0x[a-fA-F0-9]*$/).optional(),
  status: z.enum(["pending", "confirmed", "failed"]).default("pending"),
  error: z.string().optional(),
});

const updateTransactionSchema = z.object({
  status: z.enum(["pending", "confirmed", "failed"]).optional(),
  txHash: z.string().regex(/^0x[a-fA-F0-9]+$/).optional(),
  error: z.string().optional(),
});

function serializeTx(tx: typeof transactions.$inferSelect) {
  return { ...tx, createdAt: tx.createdAt.toISOString() };
}

// GET /transactions
app.get("/", async (c) => {
  const userAddress = c.get("userAddress");
  const page = Math.max(1, Number(c.req.query("page") ?? "1"));
  const pageSize = Math.min(
    50,
    Math.max(1, Number(c.req.query("pageSize") ?? "20")),
  );
  const offset = (page - 1) * pageSize;

  const [countResult] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(transactions)
    .where(eq(transactions.userAddress, userAddress));

  const items = await db
    .select()
    .from(transactions)
    .where(eq(transactions.userAddress, userAddress))
    .orderBy(desc(transactions.createdAt))
    .limit(pageSize)
    .offset(offset);

  return c.json({
    success: true,
    data: {
      items: items.map(serializeTx),
      total: countResult?.count ?? 0,
      page,
      pageSize,
    },
  });
});

// POST /transactions
app.post("/", async (c) => {
  const userAddress = c.get("userAddress");
  const body = await c.req.json();
  const parsed = createTransactionSchema.safeParse(body);

  if (!parsed.success) {
    return c.json(
      { success: false, error: parsed.error.issues[0].message },
      400,
    );
  }

  const id = nanoid(21);

  const [tx] = await db
    .insert(transactions)
    .values({
      id,
      userAddress,
      type: parsed.data.type,
      amount: parsed.data.amount,
      txHash: parsed.data.txHash ?? null,
      status: parsed.data.status,
      error: parsed.data.error ?? null,
    })
    .returning();

  return c.json({ success: true, data: serializeTx(tx) }, 201);
});

// PATCH /transactions/:id
app.patch("/:id", async (c) => {
  const userAddress = c.get("userAddress");
  const txId = c.req.param("id");
  const body = await c.req.json();
  const parsed = updateTransactionSchema.safeParse(body);

  if (!parsed.success) {
    return c.json(
      { success: false, error: parsed.error.issues[0].message },
      400,
    );
  }

  const updates: Record<string, unknown> = {};
  if (parsed.data.status !== undefined) updates.status = parsed.data.status;
  if (parsed.data.txHash !== undefined) updates.txHash = parsed.data.txHash;
  if (parsed.data.error !== undefined) updates.error = parsed.data.error;

  const [updated] = await db
    .update(transactions)
    .set(updates)
    .where(
      and(
        eq(transactions.id, txId),
        eq(transactions.userAddress, userAddress),
      ),
    )
    .returning();

  if (!updated) {
    return c.json({ success: false, error: "Transaction not found" }, 404);
  }

  return c.json({ success: true, data: serializeTx(updated) });
});

export const transactionRoutes = app;
