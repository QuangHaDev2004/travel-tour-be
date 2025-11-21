import { Router } from "express";
import * as categoryController from "../../controllers/admin/category.controller";
import * as categoryValidate from "../../validates/category.validate";
import multer from "multer";
import { storage } from "../../helpers/cloudinary.helper";

const router = Router();

const upload = multer({ storage: storage });

router.post(
  "/create",
  upload.single("avatar"),
  categoryValidate.createPost,
  categoryController.createPost
);

router.get("/list", categoryController.list);

export default router;
