import mongoose from "mongoose";

/**
 * Model lưu trữ mã OTP phục vụ tính năng quên mật khẩu.
 * @author QuangHaDev - 05.04.2026
 */
const schema = new mongoose.Schema(
  {
    email: String,
    otp: String,
    expireAt: {
      type: Date,
      expires: 0,
    },
  },
  {
    timestamps: true,
  },
);

const ForgotPassword = mongoose.model(
  "ForgotPassword",
  schema,
  "forgot-password",
);

export default ForgotPassword;
