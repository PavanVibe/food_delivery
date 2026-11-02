import { Router } from "express";
import { orderController } from "../controllers/orderController.js";
import { authenticate, authorize } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import { idParams } from "../validators/common.js";
import { checkoutBody, listOrdersQuery, manageOrdersQuery, updateStatusBody } from "../validators/order.schema.js";

const router = Router();
const staffOnly = authorize("restaurant_owner", "admin");
router.use(authenticate);

router.post("/", validate({ body: checkoutBody }), orderController.checkout);
router.get("/", validate({ query: listOrdersQuery }), orderController.listMine);
router.get("/manage", staffOnly, validate({ query: manageOrdersQuery }), orderController.listForManagement);
router.get("/:id", validate({ params: idParams }), orderController.getById);
router.patch("/:id/cancel", validate({ params: idParams }), orderController.cancel);
router.patch("/:id/status", staffOnly, validate({ params: idParams, body: updateStatusBody }), orderController.updateStatus);

export default router;
