import { Pool } from "pg";
import dotenv from "dotenv";
import path from "path";
import { drizzle } from "drizzle-orm/node-postgres";
import * as schema from "../model";

dotenv.config({ path: path.resolve(__dirname, "../.env") });
dotenv.config();

export const pool = new Pool({ connectionString: process.env.PG_URL });
export const db = drizzle(pool, { schema });
export default db;