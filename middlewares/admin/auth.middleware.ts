import { NextFunction, Response } from "express";
import AccountAdmin from "../../models/account-admin.model";
import { JwtPayloadCustom } from "../../types/jwt-payload";
import { AccountRequest } from "../../interfaces/resquest.interface";
import jwt from "jsonwebtoken";

export const verifyToken = (
  req: AccountRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers["authorization"];
    const token = authHeader && authHeader.split(" ")[1];

    if (!token) {
      return res.status(401).json({ message: "Không tìm thấy access token!" });
    }

    jwt.verify(
      token,
      `${process.env.ACCESS_TOKEN_SECRET}`,
      async (err, decoded) => {
        if (err) {
          console.log(err);
          return res.status(403).json({
            message: "Access token hết hạn hoặc không đúng!",
          });
        }

        const data = decoded as JwtPayloadCustom;

        const account = await AccountAdmin.findOne({
          _id: data.id,
        }).select("-password");

        if (!account) {
          return res.status(404).json({ message: "Người dùng không tồn tại!" });
        }

        req.account = account;
        next();
      }
    );
  } catch (error) {
    console.log("Lỗi khi xác minh JWT trong auth middleware", error);
    res.status(500).json({ message: "Lỗi hệ thống!" });
  }
};
