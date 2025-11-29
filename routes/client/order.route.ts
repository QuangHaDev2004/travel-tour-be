import { Router } from "express";
import * as orderController from "../../controllers/client/order.controller";

const router = Router();

router.post("/create", orderController.createPost);

router.get("/success", orderController.success);

export default router;
