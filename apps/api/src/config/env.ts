import dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.resolve(__dirname, "../.env") });
dotenv.config();

export const JWT_KEY = process.env.JWT_KEY as string;
export const PG_URL = (process.env.PG_URL || process.env.DATABASE_URL) as string;
export const PORT = process.env.PORT as string;
export const NODE_ENV = process.env.NODE_ENV as string;
export const LIVE_URL = process.env.LIVE_URL as string;
export const LOCAL_URL = process.env.LOCAL_URL as string;
export const OTP_EXPIRY = process.env.OTP_EXPIRY as string;
export const CLOUDINARY_CLOUD_NAME = process.env.CLOUDINARY_NAME as string;
export const CLOUDINARY_API_KEY = process.env.CLOUDINARY_API_KEY as string;
export const CLOUDINARY_API_SECRET = process.env.CLOUDINARY_API_SECRET as string;
export const EMAIL = process.env.EMAIL as string;
export const EMAIL_PASS = process.env.EMAIL_PASS as string;

export const PRODUCTION = "production";
export const COOKIE_NAME = "USER";
export const ADMIN_COOKIE_NAME = "ADMIN_TOKEN";

export const FRONTEND_URL = NODE_ENV === PRODUCTION ? (LIVE_URL as string) : (LOCAL_URL as string);

export const env = {
  email: EMAIL,
  email_pass: EMAIL_PASS,
};