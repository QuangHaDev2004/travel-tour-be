import { Router } from "express";
import * as contactController from "../../controllers/admin/contact.controller";

const router = Router();

router.get("/list", contactController.list);

export default router;
