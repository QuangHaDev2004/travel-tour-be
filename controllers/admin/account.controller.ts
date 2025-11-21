import { Request, Response } from "express";
import AccountAdmin from "../../models/account-admin.model";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import Session from "../../models/session";
import { AccountRequest } from "../../interfaces/resquest.interface";

const ACCESS_TOKEN_TTL = "15m";
const REFRESH_TOKEN_TTL = 24 * 60 * 60 * 1000;

export const registerPost = async (req: Request, res: Response) => {
  try {
    const existAccount = await AccountAdmin.findOne({
      email: req.body.email,
    });

    if (existAccount) {
      return res.status(409).json({
        message: "Email đã tồn tại trong hệ thống!",
      });
    }

    req.body.status = "initial";

    // Mã hóa mật khẩu
    const salt = await bcrypt.genSalt(10);
    req.body.password = await bcrypt.hash(req.body.password, salt);

    const newAccount = new AccountAdmin(req.body);
    await newAccount.save();

    res.status(201).json({ message: "Đăng ký tài khoản thành công!" });
  } catch (error) {
    console.log("Lỗi đăng ký account admin", error);
    res.status(500).json({ message: "Lỗi hệ thống" });
  }
};

export const loginPost = async (req: Request, res: Response) => {
  try {
    const { email, password, rememberPassword } = req.body;

    const existAccount = await AccountAdmin.findOne({
      email: email,
    });

    if (!existAccount) {
      return res.status(401).json({
        message: "Tài khoản không tồn tại!",
      });
    }

    const isPasswordValid = await bcrypt.compare(
      password,
      existAccount.password as string
    );

    if (!isPasswordValid) {
      return res.status(401).json({
        message: "Mật khẩu không chính xác!",
      });
    }

    if (existAccount.status !== "active") {
      return res.status(401).json({
        message: "Tài khoản chưa được kích hoạt!",
      });
    }

    const accessToken = jwt.sign(
      {
        id: existAccount.id,
      },
      `${process.env.ACCESS_TOKEN_SECRET}`,
      {
        expiresIn: ACCESS_TOKEN_TTL,
      }
    );

    const refreshToken = crypto.randomBytes(64).toString("hex");
    const newRecord = new Session({
      userId: existAccount.id,
      refreshToken,
      expiresAt: Date.now() + REFRESH_TOKEN_TTL,
    });
    await newRecord.save();

    res.cookie("refreshToken", refreshToken, {
      maxAge: REFRESH_TOKEN_TTL,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production", // production (https) = true, dev (htttp) = false
      sameSite: "lax", // Cho phép gửi cookie giữa các tên miền
    });

    res.status(200).json({ message: "Đăng nhập thành công!", accessToken });
  } catch (error) {
    console.log("Lỗi đăng nhập account admin", error);
    res.status(500).json({ message: "Lỗi hệ thống" });
  }
};

export const logout = async (req: Request, res: Response) => {
  try {
    const token = req.cookies?.refreshToken;

    if (token) {
      await Session.deleteOne({
        refreshToken: token,
      });

      res.clearCookie("refreshToken");
    }

    res.status(200).json({ message: "Đăng xuất thành công!" });
  } catch (error) {
    console.log("Lỗi khi gọi logout", error);
    res.status(500).json({ message: "Lỗi hệ thống" });
  }
};

export const authMe = async (req: AccountRequest, res: Response) => {
  try {
    const account = req.account;

    return res.status(200).json({
      account,
    });
  } catch (error) {
    console.error("Lỗi khi gọi authMe", error);
    return res.status(500).json({ message: "Lỗi hệ thống" });
  }
};
