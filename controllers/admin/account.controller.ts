import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import { AccountRequest } from "../../interfaces/resquest.interface";
import AccountAdmin from "../../models/account-admin.model";
import Session from "../../models/session.model";
import Role from "../../models/role.model";
import ForgotPassword from "../../models/forgot-password.model";
import { generateRandomNumber } from "../../helpers/generate.helper";
import * as mailHelper from "../../helpers/mail.helper";

const ACCESS_TOKEN_TTL = "15m";
const REFRESH_TOKEN_TTL = 24 * 60 * 60 * 1000;

/**
 * Xử lý đăng ký tài khoản Admin mới.
 * @author QuangHaDev - 20.11.2025
 */
export const registerPost = async (req: Request, res: Response) => {
  try {
    const existAccount = await AccountAdmin.findOne({
      email: req.body.email,
    });

    if (existAccount) {
      return res.status(409).json({
        message: "Email đã tồn tại trong hệ thống.",
      });
    }

    req.body.status = "initial";

    // Mã hóa mật khẩu
    const salt = await bcrypt.genSalt(10);
    req.body.password = await bcrypt.hash(req.body.password, salt);

    const newAccount = new AccountAdmin(req.body);
    await newAccount.save();

    res.status(201).json({ message: "Đăng ký tài khoản thành công." });
  } catch (error) {
    console.log("Lỗi khi gọi registerPost", error);
    res.status(500).json({ message: "Lỗi hệ thống" });
  }
};

/**
 * Xử lý đăng nhập hệ thống.
 * @author QuangHaDev - 21.11.2025
 */
export const loginPost = async (req: Request, res: Response) => {
  try {
    const { email, password, rememberPassword } = req.body;

    const existAccount = await AccountAdmin.findOne({
      email: email,
    });

    if (!existAccount) {
      return res
        .status(401)
        .json({ message: "Tài khoản hoặc mật khẩu không chính xác." });
    }

    const isPasswordValid = await bcrypt.compare(
      password,
      `${existAccount.password}`,
    );

    if (!isPasswordValid) {
      return res.status(401).json({ message: "Mật khẩu không chính xác." });
    }

    if (existAccount.status !== "active") {
      return res.status(401).json({
        message: "Tài khoản chưa được kích hoạt.",
      });
    }

    const accessToken = jwt.sign(
      {
        id: existAccount.id,
      },
      `${process.env.ACCESS_TOKEN_SECRET}`,
      {
        expiresIn: ACCESS_TOKEN_TTL,
      },
    );

    const refreshToken = crypto.randomBytes(64).toString("hex");
    const newRecord = new Session({
      userId: existAccount.id,
      refreshToken,
      expiresAt: rememberPassword
        ? new Date(Date.now() + 7 * REFRESH_TOKEN_TTL)
        : new Date(Date.now() + REFRESH_TOKEN_TTL),
    });
    await newRecord.save();

    res.cookie("refreshToken", refreshToken, {
      maxAge: rememberPassword ? 7 * REFRESH_TOKEN_TTL : REFRESH_TOKEN_TTL,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production", // production (https) = true, dev (htttp) = false
      sameSite: "lax", // Cho phép gửi cookie giữa các tên miền
    });

    res.status(200).json({ message: "Đăng nhập thành công.", accessToken });
  } catch (error) {
    console.log("Lỗi khi gọi loginPost.", error);
    res.status(500).json({ message: "Lỗi hệ thống." });
  }
};

/**
 * Xử lý yêu cầu khôi phục mật khẩu.
 * @author QuangHaDev - 05.04.2026
 */
export const forgotPasswordPost = async (req: Request, res: Response) => {
  try {
    const { email } = req.body;

    const existAccount = await AccountAdmin.findOne({
      email: email,
      status: "active",
    });

    if (!existAccount) {
      return res.status(404).json({
        message: "Email không tồn tại trong hệ thống.",
      });
    }

    // Kiểm tra email tồn tại trong Forgot Password chưa
    const existEmailInForgotPassword = await ForgotPassword.findOne({
      email: email,
    });

    if (existEmailInForgotPassword) {
      return res.status(409).json({
        message: "Vui lòng gửi lại yêu cầu sau 5 phút.",
      });
    }

    // Tạo OTP
    const otp = generateRandomNumber(6);

    // Lưu vào CSDL bản ghi mới: OTP và Email
    const record = new ForgotPassword({
      email: email,
      otp: otp,
      expireAt: Date.now() + 5 * 60 * 1000,
    });
    await record.save();

    // Gửi OTP tự động
    const title = "Mã OTP lấy lại mật khẩu";
    const content = `
      <p>Xin chào ${existAccount.fullName || "bạn"},</p>
      <p>Bạn vừa yêu cầu đặt lại mật khẩu cho tài khoản có email: <strong>${email}</strong>.</p>
      <p>Mã xác thực (OTP) của bạn là:</p>
      <h2 style="color:#2F67F6;letter-spacing:3px">${otp}</h2>
      <p>Mã OTP này chỉ có hiệu lực trong <strong>5 phút</strong>. 
      Vui lòng không chia sẻ mã này với bất kỳ ai để đảm bảo an toàn tài khoản của bạn.</p>
      <p>Nếu bạn không yêu cầu quên mật khẩu, vui lòng bỏ qua email này.</p>
      <br/>
      <p>Trân trọng,</p>
      <p><strong>Đội ngũ Hỗ trợ</strong></p>
    `;
    mailHelper.sendMail(email, title, content);

    res.status(200).json({ message: "Mã OTP đã được gửi đến email của bạn." });
  } catch (error) {
    console.log("Lỗi khi gọi forgotPasswordPost.", error);
    res.status(500).json({ message: "Lỗi hệ thống." });
  }
};

/**
 * Xử lý xác thực mã OTP và thiết lập phiên đăng nhập mới.
 * @author QuangHaDev - 05.04.2026
 */
export const otpPasswordPost = async (req: Request, res: Response) => {
  try {
    const { email, otp } = req.body;

    // Kiểm tra OTP và email
    const existRecord = await ForgotPassword.findOne({
      email: email,
      otp: otp,
    });

    if (!existRecord) {
      return res.status(400).json({ message: "Mã OTP không chính xác." });
    }

    // Kiểm tra tài khoản tồn tại không
    const account = await AccountAdmin.findOne({
      email: email,
    });

    if (!account) {
      return res.status(404).json({ message: "Tài khoản không tồn tại." });
    }

    // Tạo access token mới
    const accessToken = jwt.sign(
      {
        id: account.id,
      },
      `${process.env.ACCESS_TOKEN_SECRET}`,
      {
        expiresIn: ACCESS_TOKEN_TTL,
      },
    );

    // Tạo refresh token mới
    const refreshToken = crypto.randomBytes(64).toString("hex");
    const newRecord = new Session({
      userId: account.id,
      refreshToken,
      expiresAt: new Date(Date.now() + REFRESH_TOKEN_TTL),
    });
    await newRecord.save();

    // Gửi refresh token về client qua cookie
    res.cookie("refreshToken", refreshToken, {
      maxAge: REFRESH_TOKEN_TTL,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production", // production (https) = true, dev (htttp) = false
      sameSite: "lax", // Cho phép gửi cookie giữa các tên miền
    });

    // Xóa bản ghi OTP sau khi xác thực thành công
    await ForgotPassword.deleteOne({
      _id: existRecord._id,
    });

    res.status(200).json({
      message: "Xác thực thành công.",
      accessToken,
    });
  } catch (error) {
    console.log("Lỗi khi gọi otpPasswordPost.", error);
    res.status(500).json({ message: "Lỗi hệ thống." });
  }
};

/**
 * Thực hiện đặt lại mật khẩu mới.
 * @author QuangHaDev - 05.04.2026
 */
export const resetPasswordPost = async (req: AccountRequest, res: Response) => {
  try {
    const { password } = req.body;

    // Mã hóa mật khẩu
    const salt = await bcrypt.genSalt(10);
    const hashPassword = await bcrypt.hash(password, salt);

    await AccountAdmin.updateOne(
      {
        _id: req.account.id,
      },
      {
        password: hashPassword,
      },
    );

    res.status(200).json({ message: "Đổi mật khẩu thành công." });
  } catch (error) {
    console.log("Lỗi khi gọi resetPasswordPost.", error);
    res.status(500).json({ message: "Lỗi hệ thống." });
  }
};

/**
 * Xử lý đăng xuất tài khoản.
 * @author QuangHaDev - 21.11.2025
 */
export const logout = async (req: Request, res: Response) => {
  try {
    const token = req.cookies?.refreshToken;

    if (token) {
      await Session.deleteOne({ refreshToken: token });
      res.clearCookie("refreshToken");
    }

    res.status(200).json({ message: "Đăng xuất thành công." });
  } catch (error) {
    console.log("Lỗi khi gọi logout.", error);
    res.status(500).json({ message: "Lỗi hệ thống." });
  }
};

/**
 * Lấy thông tin tài khoản hiện tại và quyền hạn (Permissions).
 * @author QuangHaDev - 21.11.2025
 */
export const authMe = async (req: AccountRequest, res: Response) => {
  try {
    const dataFinal = {
      fullName: req.account.fullName,
      avatar: req.account.avatar,
      roleName: "",
      permissions: [] as string[],
    };

    if (req.account.role) {
      const roleInfo = await Role.findOne({
        _id: req.account.role,
      });

      dataFinal.roleName = roleInfo?.name as string;
      dataFinal.permissions = roleInfo?.permissions ?? [];
    }

    return res.status(200).json({ account: dataFinal });
  } catch (error) {
    console.error("Lỗi khi gọi authMe.", error);
    return res.status(500).json({ message: "Lỗi hệ thống." });
  }
};
