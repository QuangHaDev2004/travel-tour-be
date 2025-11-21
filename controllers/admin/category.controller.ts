import { Response } from "express";
import Category from "../../models/category.model";
import { AccountRequest } from "../../interfaces/resquest.interface";
import slugify from "slugify";
import * as categoryHelper from "../../helpers/category.helper";

export const createPost = async (req: AccountRequest, res: Response) => {
  try {
    if (req.body.position) {
      req.body.position = parseInt(req.body.position);
    } else {
      const totalRecord = await Category.countDocuments({});
      req.body.position = totalRecord + 1;
    }

    req.body.slug = slugify(req.body.name, { lower: true });
    req.body.createdBy = req.account.id;
    req.body.updatedBy = req.account.id;
    req.body.avatar = req.file ? req.file.path : "";

    const newRecord = new Category(req.body);
    await newRecord.save();

    res.status(201).json({ message: "Tạo danh mục thành công!" });
  } catch (error) {
    console.log("Lỗi khi gọi createPost", error);
    res.status(500).json({ message: "Lỗi hệ thống!" });
  }
};

export const list = async (req: AccountRequest, res: Response) => {
  try {
    const categoryList = await Category.find({
      deleted: false,
    });

    const categoryTree = categoryHelper.buildCategoryTree(categoryList, "");

    res.status(200).json({
      message: "Danh sách danh mục!",
      categoryList: categoryTree,
    });
  } catch (error) {
    console.log("Lỗi khi gọi createPost", error);
    res.status(500).json({ message: "Lỗi hệ thống!" });
  }
};
