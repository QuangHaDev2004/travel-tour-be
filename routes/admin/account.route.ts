import { Router } from "express";
import * as accountController from "../../controllers/admin/account.controller";
import * as accountValidate from "../../validates/account.validate";
import * as authMiddleware from "../../middlewares/admin/auth.middleware";

const router = Router();

router.post(
  "/register",
  accountValidate.registerPost,
  accountController.registerPost
);

router.post("/login", accountValidate.loginPost, accountController.loginPost);

router.get("/logout", accountController.logout);

router.get("/me", authMiddleware.verifyToken, accountController.authMe);

export default router;
