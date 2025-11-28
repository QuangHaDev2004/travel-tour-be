import { Router } from "express";
import * as cartController from "../../controllers/client/cart.controller";

const router = Router();

router.post("/detail", cartController.detail);

export default router;
