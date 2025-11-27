import { Router } from "express";
import * as tourController from "../../controllers/client/tour.controller";

const router = Router();

router.get("/detail/:slug", tourController.detail);

export default router;