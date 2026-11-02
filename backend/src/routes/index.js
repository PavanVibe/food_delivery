import { Router } from "express";
import { foodController } from "../controllers/foodController.js";
import { healthController } from "../controllers/healthController.js";
import aiRoutes from "./ai.routes.js";
import analyticsRoutes from "./analytics.routes.js";
import authRoutes from "./auth.routes.js";
import cartRoutes from "./cart.routes.js";
import foodRoutes from "./food.routes.js";
import orderRoutes from "./order.routes.js";
import restaurantRoutes from "./restaurant.routes.js";

const router = Router();

router.get("/health", healthController.check);
router.get("/categories", foodController.categories);
router.use("/auth", authRoutes);
router.use("/restaurants", restaurantRoutes);
router.use("/foods", foodRoutes);
router.use("/cart", cartRoutes);
router.use("/orders", orderRoutes);
router.use("/ai", aiRoutes);
router.use("/analytics", analyticsRoutes);

export default router;
