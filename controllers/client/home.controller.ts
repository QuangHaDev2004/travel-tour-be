import { Request, Response } from "express";
import SettingWebsiteInfo from "../../models/setting-website-info.model";
import Category from "../../models/category.model";
import Tour from "../../models/tour.model";
import * as categoryHelper from "../../helpers/category.helper";
import City from "../../models/city.model";
import moment from "moment";

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

export const deal = async (req: Request, res: Response) => {
  try {
    const tourListDeal = await Tour.find({
      deleted: false,
      status: "active",
    })
      .sort({
        position: "desc",
      })
      .limit(6);

    const dataFinal = [];
    for (const item of tourListDeal) {
      const itemFinal = {
        id: item.id,
        name: item.name,
        avatar: item.avatar,
        time: item.time,
        slug: item.slug,
        priceNewAdult: item.priceNewAdult,
        locationsFromName: [],
        departureDateFormat: "",
        discount: 0,
      };

      if (item.priceAdult && item.priceNewAdult) {
        itemFinal.discount = Math.floor(
          ((item.priceAdult - item.priceNewAdult) / item.priceAdult) * 100
        );
      }

      if (item.locationsFrom.length > 0) {
        itemFinal.locationsFromName = await City.find({
          _id: { $in: item.locationsFrom },
        });
      }

      if (item.departureDate) {
        itemFinal.departureDateFormat = moment(item.departureDate).format(
          "DD/MM/YYYY"
        );
      }

      dataFinal.push(itemFinal);
    }

    res.status(200).json({
      message: "Thông tin ưu đãi và danh sách tour ưu đãi!",
      tourListDeal: dataFinal,
    });
  } catch (error) {
    console.log("Lỗi khi gọi deal", error);
    res.status(500).json({ message: "Lỗi hệ thống!" });
  }
};
