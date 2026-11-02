import { Router } from "express";
import { cartController } from "../controllers/cartController.js";
import { authenticate } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import { addCartItemBody, cartItemParams, updateCartItemBody } from "../validators/cart.schema.js";

const router = Router();
router.use(authenticate);

router.get("/", cartController.get);
router.post("/items", validate({ body: addCartItemBody }), cartController.addItem);
router.patch("/items/:foodId", validate({ params: cartItemParams, body: updateCartItemBody }), cartController.updateItem);
router.delete("/items/:foodId", validate({ params: cartItemParams }), cartController.removeItem);
router.delete("/", cartController.clear);

export default router;
