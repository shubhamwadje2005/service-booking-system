export const NEXT_PUBLIC_BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL;
export const NEXT_PUBLIC_BACKEND_LIVE_URL = process.env.NEXT_PUBLIC_BACKEND_LIVE_URL;
export const NEXT_PUBLIC_API_URL = process.env.NEXT_PUBLIC_API_URL;
export const NEXT_PUBLIC_NODE_ENV = process.env.NEXT_PUBLIC_NODE_ENV || process.env.NODE_ENV;

const rawAppUrl =
  NEXT_PUBLIC_BACKEND_LIVE_URL ||
  NEXT_PUBLIC_API_URL ||
  NEXT_PUBLIC_BACKEND_URL ||
  "http://localhost:5000";

// Clean trailing slash for reliable path concatenation
export const APP_URL = rawAppUrl.replace(/\/+$/, "");
