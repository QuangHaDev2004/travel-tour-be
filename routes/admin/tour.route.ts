import { Router } from "express";
import * as tourController from "../../controllers/admin/tour.controller";
import * as tourValidate from "../../validates/tour.validate";
import multer from "multer";
import { storage } from "../../helpers/cloudinary.helper";

const router = Router();

const upload = multer({ storage: storage });

router.post(
  "/create",
  // upload.single("avatar"),
  upload.fields([
    { name: "avatar", maxCount: 1 },
    { name: "images", maxCount: 10 },
  ]),
  tourValidate.createPost,
  tourController.createPost
);

router.get("/list", tourController.list);

router.get("/edit/:id", tourController.edit);

router.patch(
  "/edit/:id",
  // upload.single("avatar"),
  upload.fields([
    { name: "avatar", maxCount: 1 },
    { name: "images", maxCount: 10 },
  ]),
  tourValidate.createPost,
  tourController.editPatch
);

router.patch("/delete/:id", tourController.deletePatch);

router.patch("/change-multi", tourController.changeMultiPatch);

router.get("/trash/list", tourController.trash);

router.patch("/undo/:id", tourController.undoPatch);

router.delete("/destroy/:id", tourController.destroyDelete);

export default router;
