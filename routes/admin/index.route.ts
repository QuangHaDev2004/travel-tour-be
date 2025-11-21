import { Router } from "express";
import accountRoutes from "./account.route";
import dashboardRoutes from "./dashboard.route";
import authRoutes from "./auth.route";
import categoryRoutes from "./category.route";
import * as authMiddleware from "../../middlewares/admin/auth.middleware";

const router = Router();

router.use("/account", accountRoutes);

router.use("/auth", authRoutes);

router.use("/dashboard", authMiddleware.verifyToken, dashboardRoutes);

router.use("/category", authMiddleware.verifyToken, categoryRoutes);

export default router;
