import { Pool } from "pg";
import dotenv from "dotenv";
import path from "path";
import { drizzle } from "drizzle-orm/node-postgres";
import * as schema from "../model";

dotenv.config({ path: path.resolve(__dirname, "../.env") });
dotenv.config();

const connectionString = process.env.PG_URL || process.env.DATABASE_URL;
const isProd = process.env.NODE_ENV === "production";

export const pool = new Pool({
  connectionString,
  ssl: isProd && !connectionString?.includes("localhost") ? { rejectUnauthorized: false } : undefined,
});
export const db = drizzle(pool, { schema });
export default db;