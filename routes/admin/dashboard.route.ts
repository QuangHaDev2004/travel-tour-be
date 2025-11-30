import { Router } from "express";
import * as dashboardController from "../../controllers/admin/dashboard.controller";

const router = Router();

router.get("/", dashboardController.dashboard);

router.post("/revenue/chart", dashboardController.revenueChartPost);

// router.get("/test", dashboardController.test); // test refresh token axios

export default router;
