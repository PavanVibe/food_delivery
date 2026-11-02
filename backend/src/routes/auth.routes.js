import { Router } from "express";
import { authController } from "../controllers/authController.js";
import { authenticate } from "../middleware/auth.js";
import { authLimiter } from "../middleware/rateLimit.js";
import { validate } from "../middleware/validate.js";
import { loginSchema, registerSchema } from "../validators/auth.schema.js";

const router = Router();

router.post("/register", authLimiter, validate({ body: registerSchema }), authController.register);
router.post("/login", authLimiter, validate({ body: loginSchema }), authController.login);
router.get("/me", authenticate, authController.me);

export default router;
