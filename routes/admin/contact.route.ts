import { Router } from "express";
import * as contactController from "../../controllers/admin/contact.controller";

const router = Router();

router.get("/list", contactController.list);

router.patch("/delete/:id", contactController.deletePatch);

router.patch("/change-multi", contactController.changeMultiPatch);

export default router;
