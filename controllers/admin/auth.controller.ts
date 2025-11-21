import { Request, Response } from "express";
import Session from "../../models/session";
import jwt from "jsonwebtoken";

const ACCESS_TOKEN_TTL = "15m";

export const refreshToken = async (req: Request, res: Response) => {
  try {
    const token = req.cookies?.refreshToken;
    if (!token) {
      return res.status(401).json({ message: "Token không tồn tại!" });
    }

    const session = await Session.findOne({ refreshToken: token });
    if (!session) {
      return res.status(403).json({
        message: "Token không hợp lệ hoặc hết hạn!",
      });
    }

    if (session.expiresAt && session.expiresAt < new Date()) {
      return res.status(403).json({ message: "Token đã hết hạn!" });
    }

    const accessToken = jwt.sign(
      {
        id: session.userId,
      },
      `${process.env.ACCESS_TOKEN_SECRET}`,
      {
        expiresIn: ACCESS_TOKEN_TTL,
      }
    );

    res.status(200).json({ accessToken });
  } catch (error) {
    console.log("Lỗi khi gọi refreshToken", error);
    res.status(500).json({ message: "Lỗi hệ thống!" });
  }
};
