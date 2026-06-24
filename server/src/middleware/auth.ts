import { Hono } from "hono";
import { createMiddleware } from "hono/factory";
import { db } from "../db/index.js";
import { sessions, users } from "../db/schema.js";
import { eq, and, gt } from "drizzle-orm";

const envVars = {
  SESSION_SECRET: process.env.SESSION_SECRET || "",
  SESSION_EXPIRY_HOURS: Number(process.env.SESSION_EXPIRY_HOURS || 720),
  CLIENT_ORIGIN: process.env.CLIENT_ORIGIN || "http://localhost:5173",
  PORT: Number(process.env.PORT || 3001),
  NODE_ENV: (process.env.NODE_ENV || "development") as
    | "development"
    | "production"
    | "test",
};

export interface AppEnv {
  Variables: {
    userAddress: string;
  };
}

export const authMiddleware = createMiddleware<AppEnv>(async (c, next) => {
  const authHeader = c.req.header("Authorization");

  if (!authHeader?.startsWith("Bearer ")) {
    return c.json(
      { success: false, error: "Missing or invalid authorization header" },
      401,
    );
  }

  const token = authHeader.slice(7);

  const [session] = await db
    .select()
    .from(sessions)
    .where(and(eq(sessions.id, token), gt(sessions.expiresAt, new Date())))
    .limit(1);

  if (!session) {
    return c.json(
      { success: false, error: "Invalid or expired session" },
      401,
    );
  }

  await db
    .update(users)
    .set({ lastSeenAt: new Date() })
    .where(eq(users.address, session.userAddress));

  c.set("userAddress", session.userAddress);
  await next();
});
