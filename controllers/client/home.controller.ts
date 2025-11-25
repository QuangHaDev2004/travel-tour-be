import { Request, Response } from "express";
import SettingWebsiteInfo from "../../models/setting-website-info.model";
import Category from "../../models/category.model";
import * as categoryHelper from "../../helpers/category.helper";

export const websiteInfo = async (req: Request, res: Response) => {
  try {
    const websiteInfo = await SettingWebsiteInfo.findOne({});

    const dataFinal = {
      websiteName: websiteInfo?.websiteName,
      phone: websiteInfo?.phone,
      email: websiteInfo?.email,
      address: websiteInfo?.address,
      facebook: websiteInfo?.facebook,
      zalo: websiteInfo?.zalo,
      logo: websiteInfo?.logo,
      favicon: websiteInfo?.favicon,
    };

    res.status(200).json({
      message: "Thông tin website!",
      websiteInfo: dataFinal,
    });
  } catch (error) {
    console.log("Lỗi khi gọi websiteInfo", error);
    res.status(500).json({ message: "Lỗi hệ thống!" });
  }
};

export const category = async (req: Request, res: Response) => {
  try {
    const categoryList = await Category.find({
      deleted: false,
      status: "active",
    }).sort({
      position: "desc",
    });

    const categoryTree = categoryHelper.buildCategoryTree(categoryList, "");

    res.status(200).json({
      message: "Thông tin website!",
      categoryList: categoryTree,
    });
  } catch (error) {
    console.log("Lỗi khi gọi category", error);
    res.status(500).json({ message: "Lỗi hệ thống!" });
  }
};
