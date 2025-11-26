import { Request, Response } from "express";
import Template from "../../models/template.model";

export const template = async (req: Request, res: Response) => {
  try {
    const templateInfo = await Template.findOne({});

    if (!templateInfo) {
      return res.status(404).json({ message: "Giao diện không tồn tại!" });
    }

    res.status(200).json({
      message: "Chi tiết giao diện!",
      templateInfo,
    });
  } catch (error) {
    console.log("Lỗi khi gọi template", error);
    res.status(500).json({ message: "Lỗi hệ thống!" });
  }
};

export const templatePatch = async (req: Request, res: Response) => {
  try {
    const templateInfo = await Template.findOne({});
    if (!templateInfo) {
      const newRecord = new Template(req.body);
      await newRecord.save();
    } else {
      await Template.updateOne(
        {
          _id: templateInfo.id,
        },
        req.body
      );
    }

    res.status(200).json({ message: "Cập nhật giao diện thành công!" });
  } catch (error) {
    console.log("Lỗi khi gọi templatePatch", error);
    res.status(500).json({ message: "Lỗi hệ thống!" });
  }
};
