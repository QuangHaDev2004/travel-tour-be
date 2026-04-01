import { Router } from "express";
import * as reportController from "../../controllers/admin/report.controller";

const router = Router();

router.post("/revenue", reportController.revenueReport);

router.get("/top-tour-quantity", reportController.topTourQuantity);

router.get("/top-tour-revenue", reportController.topTourRevenue);

export default router;
