import { Router } from "express";
import * as categoryController from "../../controllers/client/category.controller";

const router = Router();

router.get("/:slug", categoryController.list);

export default router;