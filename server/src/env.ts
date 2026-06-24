import { z } from "zod";

const envSchema = z.object({
  DATABASE_URL: z.string().url(),
  SESSION_SECRET: z.string().min(32),
  SESSION_EXPIRY_HOURS: z.coerce.number().default(720),
  CLIENT_ORIGIN: z.string().url().default("http://localhost:5173"),
  PORT: z.coerce.number().default(3001),
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
});

function loadEnv() {
  const raw = {
    DATABASE_URL: process.env.DATABASE_URL,
    SESSION_SECRET: process.env.SESSION_SECRET,
    SESSION_EXPIRY_HOURS: process.env.SESSION_EXPIRY_HOURS,
    CLIENT_ORIGIN: process.env.CLIENT_ORIGIN,
    PORT: process.env.PORT,
    NODE_ENV: process.env.NODE_ENV,
  };

  const result = envSchema.safeParse(raw);

  if (!result.success) {
    console.error("❌ Invalid environment variables:");
    console.error(result.error.flatten().fieldErrors);
    process.exit(1);
  }

  return result.data;
}

export const env = loadEnv();
