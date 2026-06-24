import { Hono } from "hono";
import { z } from "zod";
import { db } from "../db/index.js";
import { users, sessions } from "../db/schema.js";
import { eq, and, gt } from "drizzle-orm";
import { nanoid } from "nanoid";
import { verifyMessage } from "viem";
import { authMiddleware, type AppEnv } from "../middleware/auth.js";
import { rateLimit } from "../middleware/rateLimit.js";
import { env } from "../env.js";

const app = new Hono<AppEnv>();

const nonceSchema = z.object({
  address: z.string().regex(/^0x[a-fA-F0-9]{40}$/, "Invalid EVM address"),
});

const verifySchema = z.object({
  address: z.string().regex(/^0x[a-fA-F0-9]{40}$/),
  signature: z.string().regex(/^0x[a-fA-F0-9]+$/),
  nonce: z.string().min(1),
});

// POST /auth/nonce
app.post(
  "/nonce",
  rateLimit({ windowMs: 60_000, max: 10 }),
  async (c) => {
    const body = await c.req.json();
    const parsed = nonceSchema.safeParse(body);

    if (!parsed.success) {
      return c.json(
        { success: false, error: parsed.error.issues[0].message },
        400,
      );
    }

    const { address } = parsed.data;
    const normalizedAddress = address.toLowerCase();
    const nonce = nanoid(32);
    const message = `Sign this to verify your wallet:\n\nNonce: ${nonce}\nApp: Piggy\nChain: Polygon`;

    await db
      .insert(users)
      .values({
        address: normalizedAddress,
        createdAt: new Date(),
        lastSeenAt: new Date(),
      })
      .onConflictDoUpdate({
        target: users.address,
        set: { lastSeenAt: new Date() },
      });

    const sessionId = nanoid(40);
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

    await db
      .delete(sessions)
      .where(
        and(
          eq(sessions.userAddress, normalizedAddress),
          gt(sessions.expiresAt, new Date()),
        ),
      );

    await db.insert(sessions).values({
      id: sessionId,
      userAddress: normalizedAddress,
      nonce,
      expiresAt,
    });

    return c.json({ success: true, data: { nonce, message } });
  },
);

// POST /auth/verify
app.post(
  "/verify",
  rateLimit({ windowMs: 60_000, max: 10 }),
  async (c) => {
    const body = await c.req.json();
    const parsed = verifySchema.safeParse(body);

    if (!parsed.success) {
      return c.json(
        { success: false, error: parsed.error.issues[0].message },
        400,
      );
    }

    const { address, signature, nonce } = parsed.data;
    const normalizedAddress = address.toLowerCase();

    const [session] = await db
      .select()
      .from(sessions)
      .where(
        and(
          eq(sessions.userAddress, normalizedAddress),
          eq(sessions.nonce, nonce),
          gt(sessions.expiresAt, new Date()),
        ),
      )
      .limit(1);

    if (!session) {
      return c.json(
        { success: false, error: "Invalid or expired nonce" },
        400,
      );
    }

    try {
      const message = `Sign this to verify your wallet:\n\nNonce: ${nonce}\nApp: Piggy\nChain: Polygon`;
      const valid = await verifyMessage({
        address: normalizedAddress as `0x${string}`,
        message,
        signature: signature as `0x${string}`,
      });

      if (!valid) {
        return c.json({ success: false, error: "Invalid signature" }, 400);
      }
    } catch {
      return c.json(
        { success: false, error: "Signature verification failed" },
        400,
      );
    }

    const sessionToken = nanoid(40);
    const expiresAt = new Date(
      Date.now() + env.SESSION_EXPIRY_HOURS * 60 * 60 * 1000,
    );

    await db.delete(sessions).where(eq(sessions.id, session.id));

    await db.insert(sessions).values({
      id: sessionToken,
      userAddress: normalizedAddress,
      nonce: `authenticated:${nanoid(16)}`,
      expiresAt,
    });

    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.address, normalizedAddress))
      .limit(1);

    return c.json({
      success: true,
      data: {
        token: sessionToken,
        address: normalizedAddress,
        user: {
          address: user?.address ?? normalizedAddress,
          nimiqAddress: user?.nimiqAddress,
          displayName: user?.displayName,
          createdAt: user?.createdAt?.toISOString() ?? new Date().toISOString(),
          lastSeenAt:
            user?.lastSeenAt?.toISOString() ?? new Date().toISOString(),
        },
      },
    });
  },
);

// GET /auth/me
app.get("/me", authMiddleware, async (c) => {
  const userAddress = c.get("userAddress");

  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.address, userAddress))
    .limit(1);

  if (!user) {
    return c.json({ success: false, error: "User not found" }, 404);
  }

  return c.json({
    success: true,
    data: {
      address: user.address,
      nimiqAddress: user.nimiqAddress,
      displayName: user.displayName,
      createdAt: user.createdAt.toISOString(),
      lastSeenAt: user.lastSeenAt.toISOString(),
    },
  });
});

// POST /auth/logout
app.post("/logout", authMiddleware, async (c) => {
  const authHeader = c.req.header("Authorization");
  const token = authHeader?.slice(7);
  if (token) {
    await db.delete(sessions).where(eq(sessions.id, token));
  }
  return c.json({ success: true });
});

export const authRoutes = app;
