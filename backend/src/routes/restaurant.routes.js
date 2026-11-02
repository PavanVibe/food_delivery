import { Router } from "express";
import { restaurantController } from "../controllers/restaurantController.js";
import { authenticate, authorize } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import { idParams } from "../validators/common.js";
import { listRestaurantsQuery } from "../validators/restaurant.schema.js";

const router = Router();

router.get("/", validate({ query: listRestaurantsQuery }), restaurantController.list);
router.get("/mine", authenticate, authorize("restaurant_owner", "admin"), restaurantController.mine);
router.get("/:id", validate({ params: idParams }), restaurantController.getById);

export default router;
