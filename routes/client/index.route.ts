import { Router } from "express";
import homeRoutes from "./home.route";
import contactRoutes from "./contact.route";
import categoryRoutes from "./category.route";
import cityRoutes from "./city.route";
import searchRoutes from "./search.route";
import tourRoutes from "./tour.route";
import cartRoutes from "./cart.route";
import orderRoutes from "./order.route";

const router = Router();

router.use("/", homeRoutes);

router.use("/contact", contactRoutes);

router.use("/category", categoryRoutes);

router.use("/city", cityRoutes);

router.use("/search", searchRoutes);

router.use("/tour", tourRoutes);

router.use("/cart", cartRoutes);

router.use("/order", orderRoutes);

export default router;
