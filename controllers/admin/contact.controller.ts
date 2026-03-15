import { Request, Response } from "express";
import Contact from "../../models/contact.model";
import moment from "moment";
import slugify from "slugify";
import { AccountRequest } from "../../interfaces/resquest.interface";

export const list = async (req: Request, res: Response) => {
  try {
    const find: any = {
      deleted: false,
    };

    // Tìm kiếm
    if (req.query.keyword) {
      const keyword = slugify(`${req.query.keyword}`);
      const keywordRegex = new RegExp(keyword, "i");
      find.email = keywordRegex;
    }

    // Phân trang
    const limitItem = 10;
    let page = 1;
    if (req.query.page && parseInt(`${req.query.page}`) > 0) {
      page = parseInt(`${req.query.page}`);
    }
    const skip = (page - 1) * limitItem;
    const totalRecord = await Contact.countDocuments(find);
    const totalPage = Math.ceil(totalRecord / limitItem);
    const pagination = {
      skip: skip,
      totalRecord: totalRecord,
      totalPage: totalPage,
    };

    const contactList = await Contact.find(find).limit(limitItem).skip(skip);

    const dataFinal = [];
    for (const item of contactList) {
      const itemFinal = {
        id: item.id,
        email: item.email,
        createdAtFormat: "",
      };

      if (item.createdAt) {
        itemFinal.createdAtFormat = moment(item.createdAt).format(
          "HH:mm - DD/MM/YYYY",
        );
      }

      dataFinal.push(itemFinal);
    }

    res.status(200).json({
      contactList: dataFinal,
      pagination,
    });
  } catch (error) {
    console.log("Lỗi khi gọi Contact List.", error);
    res.status(500).json({ message: "Lỗi hệ thống." });
  }
};

/**
 * Xóa mềm thông tin liên hệ.
 * Cập nhật các trường deleted, deletedBy, deletedAt
 * @param req - Request chứa `params.id` và thông tin tài khoản ở `req.account`.
 * @param res - Response object dùng để trả về JSON kết quả xử lý.
 */
export const deletePatch = async (req: AccountRequest, res: Response) => {
  try {
    const id = req.params.id;

    await Contact.updateOne(
      {
        _id: id,
      },
      {
        deleted: true,
        deletedBy: req.account.id,
        deletedAt: Date.now(),
      },
    );

    res.status(200).json({ message: "Xóa thông tin liên hệ thành công." });
  } catch (error) {
    console.log("Lỗi khi gọi deletePatch.", error);
    res.status(500).json({ message: "Lỗi hệ thống." });
  }
};

/**
 * Thay đổi nhiều bản ghi theo hành động.
 * Hỗ trợ xóa mềm nhiều liên hệ cùng lúc thông qua danh sách `ids`.
 * @param req - Request chứa action (loại hành động) và ids (mảng id liên hệ).
 * @param res - Response object dùng để trả về JSON kết quả xử lý.
 */
export const changeMultiPatch = async (req: AccountRequest, res: Response) => {
  try {
    const { action, ids } = req.body;

    switch (action) {
      case "delete":
        await Contact.updateMany(
          {
            _id: { $in: ids },
          },
          {
            deleted: true,
            deletedBy: req.account.id,
            deletedAt: Date.now(),
          },
        );

        res.status(200).json({ message: "Xóa thông tin liên hệ thành công." });
        break;

      default:
        res.status(400).json({ message: "Hành động không hợp lệ." });
        break;
    }
  } catch (error) {
    console.log("Lỗi khi gọi changeMultiPatch.", error);
    res.status(500).json({ message: "Lỗi hệ thống." });
  }
};
