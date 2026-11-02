import { Router } from "express";
import { analyticsController } from "../controllers/analyticsController.js";
import { authenticate, authorize } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import { analyticsQuery } from "../validators/analytics.schema.js";

const router = Router();
router.use(authenticate, authorize("restaurant_owner", "admin"), validate({ query: analyticsQuery }));

router.get("/summary", analyticsController.summary);
router.get("/sales", analyticsController.sales);
router.get("/top-foods", analyticsController.topFoods);
router.get("/peak-hours", analyticsController.peakHours);

export default router;
