import { defineConfig } from "drizzle-kit";
import dotenv from "dotenv";

dotenv.config({ path: "./src/.env" });

export default defineConfig({
  schema: "./src/model/index.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.PG_URL as string,
  },
});
