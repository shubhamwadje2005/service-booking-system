export const NEXT_PUBLIC_BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL as string;
export const NEXT_PUBLIC_BACKEND_LIVE_URL = process.env.NEXT_PUBLIC_BACKEND_LIVE_URL as string;
export const NEXT_PUBLIC_NODE_ENV = process.env.NEXT_PUBLIC_NODE_ENV as string;

export const APP_URL =
  NEXT_PUBLIC_NODE_ENV === "production"
    ? NEXT_PUBLIC_BACKEND_LIVE_URL
    : NEXT_PUBLIC_BACKEND_URL;