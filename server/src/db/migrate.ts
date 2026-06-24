import { execSync } from "child_process";
import { fileURLToPath } from "url";
import { dirname, resolve } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
// migrate.js lives in server/dist/db/ - go up 2 levels to server/
const serverRoot = resolve(__dirname, "../../");

export async function runMigrations() {
  console.log("[DB] Pushing schema to database...");
  try {
    // Use npm script which resolves binaries through npm's own lookup
    execSync("npm run db:push", {
      cwd: serverRoot,
      stdio: "inherit",
      env: { ...process.env },
    });
    console.log("[DB] Schema push complete");
  } catch (err) {
    console.error("[DB] Schema push failed:", err);
    throw err;
  }
}
