import { Router } from "express";
import * as profileController from "../../controllers/admin/profile.controller";
import multer from "multer";
import { storage } from "../../helpers/cloudinary.helper";

const router = Router();

const upload = multer({ storage: storage });

router.get("/edit", profileController.profileEdit);

router.patch(
  "/edit",
  upload.single("avatar"),
  profileController.profileEditPatch
);

router.patch("/change-password", profileController.profileChangePasswordPatch);

export default router;
