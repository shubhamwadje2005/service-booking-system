import { Router } from "express";
import {
  register,
  login,
  logout,
  getMe,
  adminLogin,
  adminLogout,
  adminGetMe,
} from "../controller/auth.controller";
import { validate } from "../middleware/validate.middleware";
import { registerSchema, loginSchema } from "../validator/auth.validator";
import { protect } from "../middleware/auth.middleware";
import { rateLimit } from "../middleware/rateLimit.middleware";

const router = Router();

// Rate limiter: 15 requests per 1 minute window for sensitive auth endpoints
const authLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 15,
  message: "Too many authentication attempts. Please try again in a minute.",
});

// Customer Authentication
router.post("/register", authLimiter, validate(registerSchema), register);
router.post("/login", authLimiter, validate(loginSchema), login);
router.post("/logout", logout);
router.get("/me", protect(), getMe);

// Dedicated Administrator Authentication (Completely isolated cookie session)
router.post("/admin/login", authLimiter, validate(loginSchema), adminLogin);
router.post("/admin/logout", adminLogout);
router.get("/admin/me", protect("ADMIN"), adminGetMe);

export default router;
