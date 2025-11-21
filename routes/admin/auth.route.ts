import { Router } from "express";
import * as authController from "../../controllers/admin/auth.controller";

const router = Router();

router.post("/refresh", authController.refreshToken);

export default router;
