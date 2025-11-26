import { Router } from "express";
import * as contactController from "../../controllers/client/contact.controller";

const router = Router();

router.post("/create", contactController.createPost);

export default router;
