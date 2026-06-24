import { execSync } from "child_process";

export async function runMigrations() {
  console.log("[DB] Pushing schema to database...");
  try {
    execSync("npx drizzle-kit push", {
      cwd: process.cwd(),
      stdio: "inherit",
      env: { ...process.env },
    });
    console.log("[DB] Schema push complete");
  } catch (err) {
    console.error("[DB] Schema push failed:", err);
    throw err;
  }
}
