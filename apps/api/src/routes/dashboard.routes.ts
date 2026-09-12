import { Router } from "express";
import { getDashboardStats } from "../controller/dashboard.controller";
import { protect } from "../middleware/auth.middleware";

export const adminDashboardRouter = Router();

// Strict RBAC: All admin dashboard endpoints require protect("ADMIN")
adminDashboardRouter.use(protect("ADMIN"));

adminDashboardRouter.get("/stats", getDashboardStats);

export default adminDashboardRouter;
