import { Router } from "express";
import * as templateController from "../../controllers/admin/template.controller";

const router = Router();

router.get("/", templateController.template);

router.patch("/", templateController.templatePatch);

export default router;
