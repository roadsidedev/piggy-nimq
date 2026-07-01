import { Hono } from "hono";
import { z } from "zod";
import { db } from "../db/index.js";
import { users } from "../db/schema.js";
import { eq, sql } from "drizzle-orm";
import { authMiddleware, type AppEnv } from "../middleware/auth.js";

const app = new Hono<AppEnv>();
app.use("*", authMiddleware);

const updateProfileSchema = z.object({
  username: z
    .string()
    .min(3, "Username must be at least 3 characters")
    .max(20, "Username must be at most 20 characters")
    .regex(/^[a-zA-Z0-9_]+$/, "Username can only contain letters, numbers, and underscores")
    .optional(),
});

// PATCH /profile — update username
app.patch("/", async (c) => {
  const userAddress = c.get("userAddress");
  const body = await c.req.json();
  const parsed = updateProfileSchema.safeParse(body);

  if (!parsed.success) {
    return c.json(
      { success: false, error: parsed.error.issues[0].message },
      400,
    );
  }

  const { username } = parsed.data;

  if (!username) {
    return c.json({ success: false, error: "No fields to update" }, 400);
  }

  // Check uniqueness
  const [existing] = await db
    .select({ address: users.address })
    .from(users)
    .where(eq(users.username, username))
    .limit(1);

  if (existing && existing.address !== userAddress) {
    return c.json(
      { success: false, error: "Username is already taken" },
      409,
    );
  }

  await db
    .update(users)
    .set({ username })
    .where(eq(users.address, userAddress));

  const [user] = await db
    .select({
      address: users.address,
      username: users.username,
    })
    .from(users)
    .where(eq(users.address, userAddress))
    .limit(1);

  return c.json({
    success: true,
    data: {
      address: user?.address ?? userAddress,
      username: user?.username ?? null,
    },
  });
});

// GET /profile/check-username/:username — check availability
app.get("/check-username/:username", async (c) => {
  const username = c.req.param("username");

  if (username.length < 3 || username.length > 20) {
    return c.json({ success: true, data: { available: false } });
  }

  if (!/^[a-zA-Z0-9_]+$/.test(username)) {
    return c.json({ success: true, data: { available: false } });
  }

  const [existing] = await db
    .select({ address: users.address })
    .from(users)
    .where(eq(users.username, username))
    .limit(1);

  return c.json({
    success: true,
    data: { available: !existing },
  });
});

// GET /profile/:address — get public profile for any user
app.get("/:address", async (c) => {
  const address = c.req.param("address").toLowerCase();

  const [user] = await db
    .select({
      address: users.address,
      username: users.username,
    })
    .from(users)
    .where(eq(users.address, address))
    .limit(1);

  if (!user) {
    return c.json({ success: false, error: "User not found" }, 404);
  }

  return c.json({ success: true, data: user });
});

export const profileRoutes = app;
