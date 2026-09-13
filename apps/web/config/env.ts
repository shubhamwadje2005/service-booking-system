export const NEXT_PUBLIC_BACKEND_URL =
  process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:5000";
export const NEXT_PUBLIC_BACKEND_LIVE_URL =
  process.env.NEXT_PUBLIC_BACKEND_LIVE_URL || "https://service-booking-system-api.vercel.app";
export const NEXT_PUBLIC_NODE_ENV =
  process.env.NEXT_PUBLIC_NODE_ENV || process.env.NODE_ENV || "development";

export const APP_URL =
  NEXT_PUBLIC_NODE_ENV === "production" || process.env.NODE_ENV === "production"
    ? NEXT_PUBLIC_BACKEND_LIVE_URL
    : NEXT_PUBLIC_BACKEND_URL;