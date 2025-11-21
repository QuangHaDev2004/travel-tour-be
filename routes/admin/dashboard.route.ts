import { Request, Response, Router } from "express";
import * as dashboardController from "../../controllers/admin/dashboard.controller";

const router = Router();

router.get("/", (req: Request, res: Response) => {
  res.json("user");
});

router.get("/test", dashboardController.test); // test refresh token axios

export default router;
