import { Router } from "express";
import * as settingController from "../../controllers/admin/setting.controller";
import multer from "multer";
import { storage } from "../../helpers/cloudinary.helper";

const router = Router();

const upload = multer({ storage: storage });

router.get("/account-admin/list", settingController.accountAdminList);

export default router