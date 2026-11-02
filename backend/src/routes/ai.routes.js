import { Router } from "express";
import { aiController } from "../controllers/aiController.js";
import { authenticate, optionalAuth } from "../middleware/auth.js";
import { aiLimiter } from "../middleware/rateLimit.js";
import { validate } from "../middleware/validate.js";
import { recommendBody } from "../validators/ai.schema.js";

const router = Router();
router.use(aiLimiter);

router.post("/recommend", optionalAuth, validate({ body: recommendBody }), aiController.recommend);
router.get("/for-you", authenticate, aiController.forYou);

export default router;
