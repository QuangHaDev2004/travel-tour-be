import { Router } from "express";
import homeRoutes from "./home.route";
import contactRoutes from "./contact.route";
import categoryRoutes from "./category.route";

const router = Router();

router.use("/", homeRoutes);

router.use("/contact", contactRoutes);

router.use("/category", categoryRoutes);

export default router;
