import { Request, Response } from "express";
import Contact from "../../models/contact.model";
import moment from "moment";

export const list = async (req: Request, res: Response) => {
  try {
    const contactList = await Contact.find({
      deleted: false,
    });

    const dataFinal = [];
    for (const item of contactList) {
      const itemFinal = {
        id: item.id,
        email: item.email,
        createdAtFormat: "",
      };

      if (item.createdAt) {
        itemFinal.createdAtFormat = moment(item.createdAt).format(
          "HH:mm - DD/MM/YYYY"
        );
      }

      dataFinal.push(itemFinal);
    }

    res.status(200).json({
      message: "Danh sách thông tin liên hệ!",
      contactList: dataFinal,
    });
  } catch (error) {
    console.log("Lỗi khi gọi list", error);
    res.status(500).json({ message: "Lỗi hệ thống!" });
  }
};
