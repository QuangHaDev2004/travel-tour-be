import { Router } from "express";
import homeRoutes from "./home.route";

const router = Router();

router.use("/", homeRoutes);

export default router;
