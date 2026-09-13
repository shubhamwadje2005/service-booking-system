import { Pool } from "pg";
import dotenv from "dotenv";
import path from "path";
import { drizzle } from "drizzle-orm/node-postgres";
import * as schema from "../model";

dotenv.config({ path: path.resolve(__dirname, "../.env") });
dotenv.config();

const connectionString = process.env.PG_URL || process.env.DATABASE_URL;
const isLocalhost =
  connectionString?.includes("localhost") ||
  connectionString?.includes("127.0.0.1");

export const pool = new Pool({
  connectionString,
  ssl: !isLocalhost ? { rejectUnauthorized: false } : undefined,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
  keepAlive: true,
  keepAliveInitialDelayMillis: 10000,
});
export const db = drizzle(pool, { schema });

// Keep Neon compute warm and prevent idle sleep
if (process.env.NODE_ENV !== "test") {
  const timer = setInterval(async () => {
    try {
      await pool.query("SELECT 1");
    } catch {}
  }, 2.5 * 60 * 1000);
  if (timer.unref) timer.unref();
}

export default db;