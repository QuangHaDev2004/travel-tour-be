import { Router } from "express";
import homeRoutes from "./home.route";
import contactRoutes from "./contact.route";

const router = Router();

router.use("/", homeRoutes);

router.use("/contact", contactRoutes);

export default router;
