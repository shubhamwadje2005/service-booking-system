import { eq } from "drizzle-orm";
import db from "./config/db";
import { user } from "./models";
import bcryptjs from "bcryptjs";
import dotenv from "dotenv";
dotenv.config();

const SEED_ADMIN_NAME = process.env.SEED_ADMIN_NAME as string;
const SEED_ADMIN_EMAIL = process.env.SEED_ADMIN_EMAIL as string;
const SEED_ADMIN_MOBILE = process.env.SEED_ADMIN_MOBILE as string;
const SEED_ADMIN_PASSWORD = process.env.SEED_ADMIN_PASSWORD as string;
const SEED_ADMIN_ROLE = process.env.SEED_ADMIN_ROLE as string;

export const seedAdmin = async (shouldExit = false) => {
  try {
    const [result] = await db
      .select()
      .from(user)
      .where(eq(user.email, SEED_ADMIN_EMAIL));

    if (result) {
      console.log("admin already exist");
      if (shouldExit) process.exit(0);
      return;
    }

    const hashpass = await bcryptjs.hash(SEED_ADMIN_PASSWORD, 10);
    await db.insert(user).values({
      name: SEED_ADMIN_NAME || "admin",
      email: SEED_ADMIN_EMAIL,
      password: hashpass,
      role: (SEED_ADMIN_ROLE || "ADMIN").toUpperCase(),
    });

    console.log("seed complete");
    if (shouldExit) process.exit(0);
  } catch (error) {
    console.log(error);
    if (shouldExit) process.exit(1);
  }
};

export const seedAmin = seedAdmin;

// Auto-run when executed directly as CLI command
const isDirectRun =
  process.argv[1]?.replace(/\\/g, "/").endsWith("src/seed.ts") ||
  process.argv[1]?.replace(/\\/g, "/").endsWith("seed.ts");

if (isDirectRun) {
  seedAdmin(true);
}
