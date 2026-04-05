import { Router } from "express";
import * as accountController from "../../controllers/admin/account.controller";
import * as accountValidate from "../../validates/account.validate";
import * as authMiddleware from "../../middlewares/admin/auth.middleware";

const router = Router();

/**
 * Route Đăng ký tài khoản.
 * @author QuangHaDev - 21.11.2025
 */
router.post(
  "/register",
  accountValidate.registerPost,
  accountController.registerPost,
);

/**
 * Route Đăng nhập.
 * @author QuangHaDev - 21.11.2025
 */
router.post("/login", accountValidate.loginPost, accountController.loginPost);

/**
 * Route Yêu cầu khôi phục mật khẩu.
 * @author QuangHaDev - 05.04.2026
 */
router.post(
  "/forgot-password",
  accountValidate.forgotPasswordPost,
  accountController.forgotPasswordPost,
);

/**
 * Route Xác thực mã OTP.
 * @author QuangHaDev - 05.04.2026
 */
router.post(
  "/otp-password",
  accountValidate.otpPasswordPost,
  accountController.otpPasswordPost,
);

/**
 * Route Thiết lập mật khẩu mới (Reset Password).
 * @author QuangHaDev - 05.04.2026
 */
router.post(
  "/reset-password",
  authMiddleware.verifyToken,
  accountValidate.resetPasswordPost,
  accountController.resetPasswordPost,
);

/**
 * Route Đăng xuất.
 * @author QuangHaDev - 21.11.2025
 */
router.get("/logout", accountController.logout);

/**
 * Route Lấy thông tin tài khoản hiện tại.
 * @author QuangHaDev - 21.11.2025
 */
router.get("/me", authMiddleware.verifyToken, accountController.authMe);

export default router;
