import { Response } from "express";
import Tour from "../../models/tour.model";
import { AccountRequest } from "../../interfaces/resquest.interface";
import slugify from "slugify";
import { generateRandomNumber } from "../../helpers/generate.helper";
import { formatDateDDMMYY } from "../../helpers/date.helper";
import moment from "moment";
import AccountAdmin from "../../models/account-admin.model";
import { getCategoryChild } from "../../helpers/category.helper";

export const createPost = async (req: AccountRequest, res: Response) => {
  try {
    if (!req.permissions.includes("tour-create")) {
      return res.status(403).json({ message: "Không có quyền!" });
    }

    req.body.tourCode = `NQHTOUR-${generateRandomNumber(6)}-${formatDateDDMMYY(
      new Date()
    )}`;

    if (req.body.position) {
      req.body.position = parseInt(req.body.position);
    } else {
      const totalRecord = await Tour.countDocuments({});
      req.body.position = totalRecord + 1;
    }

    req.body.priceAdult = req.body.priceAdult
      ? parseInt(req.body.priceAdult)
      : 0;
    req.body.priceChildren = req.body.priceChildren
      ? parseInt(req.body.priceChildren)
      : 0;
    req.body.priceBaby = req.body.priceBaby ? parseInt(req.body.priceBaby) : 0;

    req.body.priceNewAdult = req.body.priceNewAdult
      ? parseInt(req.body.priceNewAdult)
      : req.body.priceAdult;
    req.body.priceNewChildren = req.body.priceNewChildren
      ? parseInt(req.body.priceNewChildren)
      : req.body.priceChildren;
    req.body.priceNewBaby = req.body.priceNewBaby
      ? parseInt(req.body.priceNewBaby)
      : req.body.priceBaby;

    req.body.stockAdult = req.body.stockAdult
      ? parseInt(req.body.stockAdult)
      : 0;
    req.body.stockChildren = req.body.stockChildren
      ? parseInt(req.body.stockChildren)
      : 0;
    req.body.stockBaby = req.body.stockBaby ? parseInt(req.body.stockBaby) : 0;

    req.body.locationsFrom = req.body.locationsFrom
      ? JSON.parse(req.body.locationsFrom)
      : [];
    req.body.locationsTo = req.body.locationsTo
      ? JSON.parse(req.body.locationsTo)
      : [];
    req.body.departureDate = req.body.departureDate
      ? new Date(req.body.departureDate)
      : null;
    req.body.schedules = req.body.schedules
      ? JSON.parse(req.body.schedules)
      : [];

    req.body.slug = slugify(req.body.name, {
      lower: true,
      strict: true,
      locale: "vi",
    });
    req.body.createdBy = req.account.id;
    req.body.updatedBy = req.account.id;

    // Process Image
    const files = req.files as any;

    if (files && files.avatar && files.avatar.length > 0) {
      req.body.avatar = files.avatar[0].path;
    } else {
      req.body.avatar = "";
    }

    if (files && files.images && files.images.length > 0) {
      req.body.images = files.images.map((item: any) => item.path);
    } else {
      req.body.images = [];
    }

    // req.body.avatar = req.file ? req.file.path : "";

    const newRecord = new Tour(req.body);
    await newRecord.save();

    res.status(201).json({ message: "Tạo tour thành công!" });
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

    // Lọc theo danh mục
    if (req.query.category) {
      const categoryId = req.query.category;
      const categoryChild = await getCategoryChild(categoryId);
      const categoryChildId = categoryChild.map(
        (item: { id: string; name: string }) => item.id
      );
      find.category = {
        $in: [categoryId, ...categoryChildId],
      };
    }

    // Lọc theo khoảng giá
    if (req.query.price) {
      const [priceMin, priceMax] = `${req.query.price}`
        .split("-")
        .map((item) => parseInt(item));
      find.priceNewAdult = {
        $gte: priceMin,
        $lte: priceMax,
      };
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

    // Tìm kiếm
    if (req.query.keyword) {
      const keyword = slugify(`${req.query.keyword}`);
      const keywordRegex = new RegExp(keyword, "i");
      find.slug = keywordRegex;
    }

    // Phân trang
    const limitItem = 4;
    let page = 1;
    if (req.query.page && parseInt(`${req.query.page}`) > 0) {
      page = parseInt(`${req.query.page}`);
    }
    const skip = (page - 1) * limitItem;
    const totalRecord = await Tour.countDocuments(find);
    const totalPage = Math.ceil(totalRecord / limitItem);
    const pagination = {
      skip: skip,
      totalRecord: totalRecord,
      totalPage: totalPage,
    };

    const tourList = await Tour.find(find)
      .sort({
        position: "desc",
      })
      .limit(limitItem)
      .skip(skip);

    const dataFinal = [];
    for (const item of tourList) {
      const itemFinal = {
        id: item.id,
        name: item.name,
        avatar: item.avatar,
        priceNewAdult: item.priceNewAdult,
        priceNewChildren: item.priceNewChildren,
        priceNewBaby: item.priceNewBaby,
        stockAdult: item.stockAdult,
        stockChildren: item.stockChildren,
        stockBaby: item.stockBaby,
        position: item.position,
        status: item.status,
        createdAt: item.createdAt,
        updatedAt: item.updatedAt,
        createdByFullName: "",
        updatedByFullName: "",
      };

      if (item.createdBy) {
        const infoAccount = await AccountAdmin.findOne({
          _id: item.createdBy,
        });

        itemFinal.createdByFullName = infoAccount?.fullName as string;
      }

      if (item.updatedBy) {
        const infoAccount = await AccountAdmin.findOne({
          _id: item.updatedBy,
        });

        itemFinal.updatedByFullName = infoAccount?.fullName as string;
      }

      dataFinal.push(itemFinal);
    }

    res.status(200).json({
      message: "Danh sách tour!",
      tourList: dataFinal,
      pagination,
    });
  } catch (error) {
    console.log("Lỗi khi gọi list", error);
    res.status(500).json({ message: "Lỗi hệ thống!" });
  }
};

export const edit = async (req: AccountRequest, res: Response) => {
  try {
    const id = req.params.id;

    const tourDetail = await Tour.findOne({
      _id: id,
      deleted: false,
    });

    const dataFinal = {
      id: tourDetail?.id,
      name: tourDetail?.name,
      category: tourDetail?.category,
      position: tourDetail?.position,
      status: tourDetail?.status,
      avatar: tourDetail?.avatar,
      images: tourDetail?.images,
      priceAdult: tourDetail?.priceAdult,
      priceChildren: tourDetail?.priceChildren,
      priceBaby: tourDetail?.priceBaby,
      priceNewAdult: tourDetail?.priceNewAdult,
      priceNewChildren: tourDetail?.priceNewChildren,
      priceNewBaby: tourDetail?.priceNewBaby,
      stockAdult: tourDetail?.stockAdult,
      stockChildren: tourDetail?.stockChildren,
      stockBaby: tourDetail?.stockBaby,
      information: tourDetail?.information,
      locationsFrom: tourDetail?.locationsFrom,
      locationsTo: tourDetail?.locationsTo,
      time: tourDetail?.time,
      vehicle: tourDetail?.vehicle,
      schedules: tourDetail?.schedules,
      departureDateFormat: "",
    };

    if (tourDetail?.departureDate) {
      dataFinal.departureDateFormat = moment(tourDetail.departureDate).format(
        "YYYY-MM-DD"
      );
    }

    res.status(200).json({
      message: "Chi tiết tour!",
      tourDetail: dataFinal,
    });
  } catch (error) {
    console.log("Lỗi khi gọi edit", error);
    res.status(500).json({ message: "Lỗi hệ thống!" });
  }
};

export const editPatch = async (req: AccountRequest, res: Response) => {
  try {
    const id = req.params.id;

    const tourDetail = await Tour.findOne({
      _id: id,
      deleted: false,
    });

    if (!tourDetail) {
      return res.status(404).json({ message: "Tour không tồn tại!" });
    }

    if (req.body.position) {
      req.body.position = parseInt(req.body.position);
    } else {
      const totalRecord = await Tour.countDocuments({});
      req.body.position = totalRecord + 1;
    }

    req.body.priceAdult = req.body.priceAdult
      ? parseInt(req.body.priceAdult)
      : 0;
    req.body.priceChildren = req.body.priceChildren
      ? parseInt(req.body.priceChildren)
      : 0;
    req.body.priceBaby = req.body.priceBaby ? parseInt(req.body.priceBaby) : 0;

    req.body.priceNewAdult = req.body.priceNewAdult
      ? parseInt(req.body.priceNewAdult)
      : req.body.priceAdult;
    req.body.priceNewChildren = req.body.priceNewChildren
      ? parseInt(req.body.priceNewChildren)
      : req.body.priceChildren;
    req.body.priceNewBaby = req.body.priceNewBaby
      ? parseInt(req.body.priceNewBaby)
      : req.body.priceBaby;

    req.body.stockAdult = req.body.stockAdult
      ? parseInt(req.body.stockAdult)
      : 0;
    req.body.stockChildren = req.body.stockChildren
      ? parseInt(req.body.stockChildren)
      : 0;
    req.body.stockBaby = req.body.stockBaby ? parseInt(req.body.stockBaby) : 0;

    req.body.locationsFrom = req.body.locationsFrom
      ? JSON.parse(req.body.locationsFrom)
      : [];
    req.body.locationsTo = req.body.locationsTo
      ? JSON.parse(req.body.locationsTo)
      : [];
    req.body.departureDate = req.body.departureDate
      ? new Date(req.body.departureDate)
      : null;
    req.body.schedules = req.body.schedules
      ? JSON.parse(req.body.schedules)
      : [];

    req.body.slug = slugify(req.body.name, {
      lower: true,
      strict: true,
      locale: "vi",
    });
    req.body.updatedBy = req.account.id;

    // Images Process
    const files = req.files as any;

    if (files && files.avatar && files.avatar.length > 0) {
      req.body.avatar = files.avatar[0].path;
    } else {
      delete req.body.avatar;
    }

    req.body.images = req.body.images
      ? Array.isArray(req.body.images)
        ? req.body.images
        : [req.body.images]
      : [];

    if (files && files.images && files.images.length > 0) {
      for (const file of files.images as any[]) {
        req.body.images.push(file.path);
      }
    }

    // if (req.file) {
    //   req.body.avatar = req.file.path;
    // } else {
    //   delete req.body.avatar;
    // }

    await Tour.updateOne(
      {
        _id: id,
        deleted: false,
      },
      req.body
    );

    res.status(200).json({ message: "Cập nhật tour thành công!" });
  } catch (error) {
    console.log("Lỗi khi gọi editPatch", error);
    res.status(500).json({ message: "Lỗi hệ thống!" });
  }
};

export const deletePatch = async (req: AccountRequest, res: Response) => {
  try {
    const id = req.params.id;

    await Tour.updateOne(
      {
        _id: id,
      },
      {
        deleted: true,
        deletedBy: req.account.id,
        deletedAt: Date.now(),
      }
    );

    res.status(200).json({ message: "Xóa tour thành công!" });
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
        await Tour.updateMany(
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
        await Tour.updateMany(
          {
            _id: { $in: ids },
          },
          {
            deleted: true,
            deletedBy: req.account.id,
            deletedAt: Date.now(),
          }
        );

        res.status(200).json({ message: "Xóa tour thành công!" });
        break;
      case "undo":
        await Tour.updateMany(
          {
            _id: { $in: ids },
          },
          {
            deleted: false,
          }
        );

        res.status(200).json({ message: "Khôi phục tour thành công!" });
        break;
      case "destroy":
        await Tour.deleteMany({ _id: { $in: ids } });

        res.status(200).json({ message: "Xóa vĩnh viễn tour thành công!" });
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

export const trash = async (req: AccountRequest, res: Response) => {
  try {
    const find: any = {
      deleted: true,
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

    // Tìm kiếm
    if (req.query.keyword) {
      const keyword = slugify(`${req.query.keyword}`);
      const keywordRegex = new RegExp(keyword, "i");
      find.slug = keywordRegex;
    }

    // Phân trang
    const limitItem = 4;
    let page = 1;
    if (req.query.page && parseInt(`${req.query.page}`) > 0) {
      page = parseInt(`${req.query.page}`);
    }
    const skip = (page - 1) * limitItem;
    const totalRecord = await Tour.countDocuments(find);
    const totalPage = Math.ceil(totalRecord / limitItem);
    const pagination = {
      skip: skip,
      totalRecord: totalRecord,
      totalPage: totalPage,
    };

    const tourList = await Tour.find(find)
      .sort({
        position: "desc",
      })
      .limit(limitItem)
      .skip(skip);

    const dataFinal = [];
    for (const item of tourList) {
      const itemFinal = {
        id: item.id,
        name: item.name,
        avatar: item.avatar,
        priceNewAdult: item.priceNewAdult,
        priceNewChildren: item.priceNewChildren,
        priceNewBaby: item.priceNewBaby,
        stockAdult: item.stockAdult,
        stockChildren: item.stockChildren,
        stockBaby: item.stockBaby,
        position: item.position,
        status: item.status,
        createdAt: item.createdAt,
        updatedAt: item.updatedAt,
        createdByFullName: "",
        updatedByFullName: "",
      };

      if (item.createdBy) {
        const infoAccount = await AccountAdmin.findOne({
          _id: item.createdBy,
        });

        itemFinal.createdByFullName = infoAccount?.fullName as string;
      }

      if (item.updatedBy) {
        const infoAccount = await AccountAdmin.findOne({
          _id: item.updatedBy,
        });

        itemFinal.updatedByFullName = infoAccount?.fullName as string;
      }

      dataFinal.push(itemFinal);
    }

    res.status(200).json({
      message: "Danh sách tour trash!",
      tourTrashList: dataFinal,
      pagination,
    });
  } catch (error) {
    console.log("Lỗi khi gọi trash", error);
    res.status(500).json({ message: "Lỗi hệ thống!" });
  }
};

export const undoPatch = async (req: AccountRequest, res: Response) => {
  try {
    const id = req.params.id;

    await Tour.updateOne(
      {
        _id: id,
      },
      {
        deleted: false,
      }
    );

    res.status(200).json({ message: "Khôi phục tour thành công!" });
  } catch (error) {
    console.log("Lỗi khi gọi undoPatch", error);
    res.status(500).json({ message: "Lỗi hệ thống!" });
  }
};

export const destroyDelete = async (req: AccountRequest, res: Response) => {
  try {
    const id = req.params.id;

    await Tour.deleteOne({ _id: id });

    res.status(200).json({ message: "Xóa vĩnh viễn tour thành công!" });
  } catch (error) {
    console.log("Lỗi khi gọi destroyDelete", error);
    res.status(500).json({ message: "Lỗi hệ thống!" });
  }
};
