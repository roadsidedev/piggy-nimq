import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import { secureHeaders } from "hono/secure-headers";
import { serve } from "@hono/node-server";
import { env } from "./env.js";
import { runMigrations } from "./db/migrate.js";
import { authRoutes } from "./routes/auth.js";
import { goalRoutes } from "./routes/goals.js";
import { challengeRoutes } from "./routes/challenges.js";
import { recurringRoutes } from "./routes/recurring.js";
import { transactionRoutes } from "./routes/transactions.js";
import { analyticsRoutes } from "./routes/analytics.js";
import { profileRoutes } from "./routes/profile.js";

const app = new Hono()
  .use("*", logger())
  .use(
    "*",
    cors({
      origin: env.CLIENT_ORIGIN,
      allowMethods: ["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
      allowHeaders: ["Content-Type", "Authorization"],
      credentials: true,
      maxAge: 86400,
    }),
  )
  .use("*", secureHeaders())
  .get("/health", (c) =>
    c.json({
      status: "ok",
      timestamp: new Date().toISOString(),
      env: env.NODE_ENV,
    }),
  )
  .route("/auth", authRoutes)
  .route("/goals", goalRoutes)
  .route("/challenges", challengeRoutes)
  .route("/recurring", recurringRoutes)
  .route("/transactions", transactionRoutes)
  .route("/profile", profileRoutes)
  .route("/api", analyticsRoutes)
  .notFound((c) =>
    c.json({ success: false, error: "Not found" }, 404),
  )
  .onError((err, c) => {
    console.error(`[ERROR] ${err.message}`, err.stack);
    return c.json(
      {
        success: false,
        error:
          env.NODE_ENV === "production"
            ? "Internal server error"
            : err.message,
      },
      500,
    );
  });

async function main() {
  // Auto-migrate database on startup
  await runMigrations();

  const port = env.PORT;
  console.log(`Piggy API server starting on port ${port}`);
  console.log(`  Environment: ${env.NODE_ENV}`);
  console.log(`  Client origin: ${env.CLIENT_ORIGIN}`);

  serve({ fetch: app.fetch, port });
}

main().catch((err) => {
  console.error("Failed to start server:", err);
  process.exit(1);
});

export type AppType = typeof app;
