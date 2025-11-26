import { Router } from "express";
import * as homeController from "../../controllers/client/home.controller";

const router = Router();

router.get("/website-info", homeController.websiteInfo);

router.get("/category", homeController.category);

router.get("/deal", homeController.deal);

export default router;
