import { Response } from "express";
import Category from "../../models/category.model";
import { AccountRequest } from "../../interfaces/resquest.interface";
import slugify from "slugify";
import * as categoryHelper from "../../helpers/category.helper";
import AccountAdmin from "../../models/account-admin.model";
import moment from "moment";

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
    const find: any = {
      deleted: false,
    };

    // Lọc theo trạng thái
    if (req.query.status) {
      find.status = req.query.status;
    }

    // Lọc theo người tạo
    if (req.query.createdBy) {
      find.createdBy = req.query.createdBy;
    }

    // Lọc theo ngày tạo
    const dateFilter: any = {};
    if (req.query.startDate) {
      const startDate = moment(`${req.query.startDate}`).toDate();
      dateFilter.$gte = startDate;
    }
    if (req.query.endDate) {
      const endDate = moment(`${req.query.endDate}`).endOf("day").toDate();
      dateFilter.$lte = endDate;
    }
    if (Object.keys(dateFilter).length > 0) {
      find.createdAt = dateFilter;
    }

    const categoryList = await Category.find(find).sort({
      position: "desc",
    });

    const categoryTree = categoryHelper.buildCategoryTree(categoryList, "");

    const dataFinal = [];
    for (const item of categoryList) {
      const itemFinal = {
        id: item.id,
        name: item.name,
        avatar: item.avatar,
        position: item.position,
        status: item.status,
        createdAt: item.createdAt,
        updatedAt: item.updatedAt,
        createdByFullName: "",
        updatedByFullName: "",
      };

      const infoAccount = await AccountAdmin.findOne({
        _id: item.createdBy,
      });

      if (infoAccount) {
        itemFinal.createdByFullName = infoAccount.fullName as string;
        itemFinal.updatedByFullName = infoAccount.fullName as string;
      }

      dataFinal.push(itemFinal);
    }

    const accountAdminList = await AccountAdmin.find({});
    const accountListFinal = [];
    for (const item of accountAdminList) {
      const itemFinal = {
        id: item.id,
        fullName: item.fullName,
      };

      accountListFinal.push(itemFinal);
    }

    res.status(200).json({
      message: "Danh sách danh mục!",
      categoryTree: categoryTree,
      categoryList: dataFinal,
      accountAdminList: accountListFinal,
    });
  } catch (error) {
    console.log("Lỗi khi gọi list", error);
    res.status(500).json({ message: "Lỗi hệ thống!" });
  }
};

export const edit = async (req: AccountRequest, res: Response) => {
  try {
    const id = req.params.id;

    const categoryDetail = await Category.findOne({
      _id: id,
      deleted: false,
    });

    const dataFinal = {
      id: categoryDetail?.id,
      name: categoryDetail?.name,
      parent: categoryDetail?.parent,
      position: categoryDetail?.position,
      status: categoryDetail?.status,
      avatar: categoryDetail?.avatar,
      description: categoryDetail?.description,
    };

    res.status(200).json({
      message: "Chi tiết danh mục!",
      categoryDetail: dataFinal,
    });
  } catch (error) {
    console.log("Lỗi khi gọi edit", error);
    res.status(500).json({ message: "Lỗi hệ thống!" });
  }
};

export const editPatch = async (req: AccountRequest, res: Response) => {
  try {
    const id = req.params.id;

    if (req.body.position) {
      req.body.position = parseInt(req.body.position);
    } else {
      const totalRecord = await Category.countDocuments({});
      req.body.position = totalRecord + 1;
    }

    req.body.slug = slugify(req.body.name, { lower: true });
    req.body.updatedBy = req.account.id;

    if (req.file) {
      req.body.avatar = req.file.path;
    } else {
      delete req.body.avatar;
    }

    await Category.updateOne(
      {
        _id: id,
        deleted: false,
      },
      req.body
    );

    res.status(200).json({ message: "Cập nhật thành công!" });
  } catch (error) {
    console.log("Lỗi khi gọi editPatch", error);
    res.status(500).json({ message: "Lỗi hệ thống!" });
  }
};

export const deletePatch = async (req: AccountRequest, res: Response) => {
  try {
    const id = req.params.id;

    await Category.updateOne(
      {
        _id: id,
      },
      {
        deleted: true,
        deletedBy: req.account.id,
        deletedAt: Date.now(),
      }
    );

    res.status(200).json({ message: "Xóa danh mục thành công!" });
  } catch (error) {
    console.log("Lỗi khi gọi deletePatch", error);
    res.status(500).json({ message: "Lỗi hệ thống!" });
  }
};

export const changeMultiPatch = async (req: AccountRequest, res: Response) => {
  try {
    const { action, ids } = req.body;

    switch (action) {
      case "active":
      case "inactive":
        await Category.updateMany(
          {
            _id: { $in: ids },
          },
          {
            status: action,
          }
        );
        res.status(200).json({ message: "Cập nhật trạng thái thành công!" });
        break;
      case "delete":
        await Category.updateMany(
          {
            _id: { $in: ids },
          },
          {
            deleted: true,
            deletedBy: req.account.id,
            deletedAt: Date.now(),
          }
        );
        res.status(200).json({ message: "Xóa danh mục thành công!" });
        break;
      default:
        res.status(400).json({ message: "Hành động không hợp lệ!" });
        break;
    }
  } catch (error) {
    console.log("Lỗi khi gọi changeMultiPatch", error);
    res.status(500).json({ message: "Lỗi hệ thống!" });
  }
};
