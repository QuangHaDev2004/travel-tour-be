import { Router } from "express";
import accountRoutes from "./account.route";
import dashboardRoutes from "./dashboard.route";
import authRoutes from "./auth.route";
import categoryRoutes from "./category.route";
import cityRoutes from "./city.route";
import tourRoutes from "./tour.route";
import settingRoutes from "./setting.route";
import profileRoutes from "./profile.route";
import templateRoutes from "./template.route";
import contactRoutes from "./contact.route";
import uploadRoutes from "./upload.route";
import orderRoutes from "./order.route";

import * as authMiddleware from "../../middlewares/admin/auth.middleware";

const router = Router();

router.use("/account", accountRoutes);

router.use("/auth", authRoutes);

router.use("/dashboard", authMiddleware.verifyToken, dashboardRoutes);

router.use("/category", authMiddleware.verifyToken, categoryRoutes);

router.use("/city", cityRoutes);

router.use("/tour", authMiddleware.verifyToken, tourRoutes);

router.use("/setting", authMiddleware.verifyToken, settingRoutes);

router.use("/profile", authMiddleware.verifyToken, profileRoutes);

router.use("/template", authMiddleware.verifyToken, templateRoutes);

router.use("/contact", authMiddleware.verifyToken, contactRoutes);

router.use("/upload", uploadRoutes);

router.use("/order", authMiddleware.verifyToken, orderRoutes);

export default router;
