import { Request, Response } from "express";
import Contact from "../../models/contact.model";

export const createPost = async (req: Request, res: Response) => {
  try {
    const { email } = req.body;

    const existEmail = await Contact.findOne({
      email: email,
      deleted: false,
    });

    if (existEmail) {
      return res.status(409).json({
        message: "Email của bạn đã từng đăng ký trước đây!",
      });
    }

    const newRecord = new Contact({
      email: email,
    });
    await newRecord.save();

    res.status(201).json({
      message: "Chúc mừng bạn đã đăng ký nhận email thành công!",
    });
  } catch (error) {
    console.log("Lỗi khi gọi createPost", error);
    res.status(500).json({ message: "Lỗi hệ thống!" });
  }
};
