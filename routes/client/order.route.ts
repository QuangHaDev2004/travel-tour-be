import { Router } from "express";
import * as orderController from "../../controllers/client/order.controller";

const router = Router();

router.post("/create", orderController.createPost);

export default router;
