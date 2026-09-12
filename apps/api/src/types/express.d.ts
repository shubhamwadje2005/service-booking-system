import { User } from "@repo/types";

declare global {
  namespace Express {
    interface Request {
      user?: User;
    }
  }
}
