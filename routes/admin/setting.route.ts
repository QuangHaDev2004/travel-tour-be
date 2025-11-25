import { Router } from "express";
import * as settingController from "../../controllers/admin/setting.controller";
import multer from "multer";
import { storage } from "../../helpers/cloudinary.helper";

const router = Router();

const upload = multer({ storage: storage });

router.get("/account-admin/list", settingController.accountAdminList);

router.post(
  "/account-admin/create",
  upload.single("avatar"),
  settingController.accountAdminCreatePost
);

router.get("/account-admin/edit/:id", settingController.accountAdminEdit);

router.patch(
  "/account-admin/edit/:id",
  upload.single("avatar"),
  settingController.accountAdminEditPatch
);

router.patch(
  "/website-info",
  upload.fields([
    { name: "logo", maxCount: 1 },
    { name: "favicon", maxCount: 1 },
  ]),
  settingController.websiteInfoPatch
);

router.get("/website-info", settingController.websiteInfo);

router.post("/role/create", settingController.roleCreatePost);

router.get("/role/list", settingController.roleList);

router.get("/role/edit/:id", settingController.roleEdit);

router.patch("/role/edit/:id", settingController.roleEditPatch);

export default router;
