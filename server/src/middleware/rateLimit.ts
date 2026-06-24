import { createMiddleware } from "hono/factory";

const rateLimitStore = new Map<string, { count: number; resetAt: number }>();

export interface RateLimitOptions {
  windowMs: number;
  max: number;
}

export function rateLimit(opts: RateLimitOptions) {
  return createMiddleware(async (c, next) => {
    const ip =
      c.req.header("x-forwarded-for")?.split(",")[0] ??
      c.req.header("x-real-ip") ??
      "unknown";

    const now = Date.now();
    const record = rateLimitStore.get(ip);

    if (!record || now > record.resetAt) {
      rateLimitStore.set(ip, { count: 1, resetAt: now + opts.windowMs });
      return next();
    }

    if (record.count >= opts.max) {
      const retryAfter = Math.ceil((record.resetAt - now) / 1000);
      c.header("Retry-After", String(retryAfter));
      return c.json({ success: false, error: "Too many requests" }, 429);
    }

    record.count++;
    await next();
  });
}

// Cleanup stale entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, val] of rateLimitStore) {
    if (now > val.resetAt) rateLimitStore.delete(key);
  }
}, 5 * 60 * 1000);
