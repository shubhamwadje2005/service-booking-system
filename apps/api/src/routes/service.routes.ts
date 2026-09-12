import { Router } from "express";
import {
  getServices,
  getServiceById,
  getServiceAvailability,
  getAdminServices,
  createService,
  updateService,
  deleteService,
} from "../controller/service.controller";
import { protect } from "../middleware/auth.middleware";
import { validate } from "../middleware/validate.middleware";
import {
  createServiceSchema,
  updateServiceSchema,
  serviceIdParamSchema,
  serviceQuerySchema,
} from "../validator/service.validator";
import { availabilityQuerySchema } from "../validator/booking.validator";

export const serviceRouter = Router();
export const adminServiceRouter = Router();

// ==========================================
// PUBLIC SERVICE ROUTES
// Mounted at: /api/services
// ==========================================
serviceRouter.get("/", validate({ query: serviceQuerySchema }), getServices);
serviceRouter.get("/:id", validate({ params: serviceIdParamSchema }), getServiceById);
serviceRouter.get(
  "/:id/availability",
  validate({ params: serviceIdParamSchema, query: availabilityQuerySchema }),
  getServiceAvailability
);

// ==========================================
// ADMIN SERVICE ROUTES
// Mounted at: /api/admin/services
// Strict RBAC: protect("ADMIN") on all endpoints
// ==========================================
adminServiceRouter.use(protect("ADMIN"));

adminServiceRouter.get("/", validate({ query: serviceQuerySchema }), getAdminServices);
adminServiceRouter.post("/", validate(createServiceSchema), createService);
adminServiceRouter.put(
  "/:id",
  validate({ params: serviceIdParamSchema, body: updateServiceSchema }),
  updateService
);
adminServiceRouter.delete(
  "/:id",
  validate({ params: serviceIdParamSchema }),
  deleteService
);

export default serviceRouter;
