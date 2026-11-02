import { Router } from "express";
import { foodController } from "../controllers/foodController.js";
import { authenticate, authorize } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import { idParams } from "../validators/common.js";
import { createFoodBody, listFoodsQuery, searchFoodsQuery, updateFoodBody } from "../validators/food.schema.js";

const router = Router();
const canManage = [authenticate, authorize("restaurant_owner", "admin")];

router.get("/", validate({ query: listFoodsQuery }), foodController.list);
router.get("/search", validate({ query: searchFoodsQuery }), foodController.search);
router.get("/:id", validate({ params: idParams }), foodController.getById);
router.post("/", ...canManage, validate({ body: createFoodBody }), foodController.create);
router.patch("/:id", ...canManage, validate({ params: idParams, body: updateFoodBody }), foodController.update);
router.delete("/:id", ...canManage, validate({ params: idParams }), foodController.remove);

export default router;
