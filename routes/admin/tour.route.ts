import { Router } from "express";
import * as tourController from "../../controllers/admin/tour.controller";
import * as tourValidate from "../../validates/tour.validate";
import multer from "multer";
import { storage } from "../../helpers/cloudinary.helper";

const router = Router();

const upload = multer({ storage: storage });

router.post(
  "/create",
  upload.single("avatar"),
  tourValidate.createPost,
  tourController.createPost
);

router.get("/list", tourController.list);

router.patch("/delete/:id", tourController.deletePatch);

router.patch("/change-multi", tourController.changeMultiPatch);


export default router;
