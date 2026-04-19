import { Router } from "express";
import * as reportController from "../../controllers/admin/report.controller";

const router = Router();

router.post("/revenue", reportController.revenueReport);

router.post("/top-tour-quantity", reportController.topTourQuantity);

router.post("/top-tour-revenue", reportController.topTourRevenue);

export default router;
