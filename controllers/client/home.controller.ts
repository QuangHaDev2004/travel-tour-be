import { Request, Response } from "express";
import SettingWebsiteInfo from "../../models/setting-website-info.model";
import Category from "../../models/category.model";
import Tour from "../../models/tour.model";
import * as categoryHelper from "../../helpers/category.helper";
import City from "../../models/city.model";
import moment from "moment";
import Template from "../../models/template.model";

export const websiteInfo = async (req: Request, res: Response) => {
  try {
    const websiteInfo = await SettingWebsiteInfo.findOne({});

    if (!websiteInfo) {
      return res.status(404).json({
        message: "Thông tin website không tồn tại!",
      });
    }

    const dataFinal = {
      websiteName: websiteInfo.websiteName,
      phone: websiteInfo.phone,
      email: websiteInfo.email,
      address: websiteInfo.address,
      facebook: websiteInfo.facebook,
      zalo: websiteInfo.zalo,
      logo: websiteInfo.logo,
      favicon: websiteInfo.favicon,
    };

    res.status(200).json({ websiteInfo: dataFinal });
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

    res.status(200).json({ categoryTree });
  } catch (error) {
    console.log("Lỗi khi gọi category tree", error);
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

export const list = async (req: Request, res: Response) => {
  try {
    const templateInfo = await Template.findOne({});

    if (!templateInfo) {
      return res.status(404).json({ message: "Giao diện không tồn tại!" });
    }

    // Tour List One
    const categoryIdTourListOne = templateInfo?.dataTourListOne;
    const categoryChildTourListOne = await categoryHelper.getCategoryChild(
      categoryIdTourListOne
    );
    const categoryChildIdTourListOne = categoryChildTourListOne.map(
      (item: any) => item.id
    );

    const categoryTourListOne = await Category.findOne({
      _id: categoryIdTourListOne,
      deleted: false,
      status: "active",
    });

    if (!categoryTourListOne) {
      return res.status(404).json({ message: "Danh mục không tồn tại!" });
    }

    const categoryOneFinal = {
      name: categoryTourListOne.name,
      slug: categoryTourListOne.slug,
    };

    const tourListOne = await Tour.find({
      category: {
        $in: [categoryIdTourListOne, ...categoryChildIdTourListOne],
      },
      deleted: false,
      status: "active",
    })
      .sort({
        position: "desc",
      })
      .limit(8);

    const tourListOneFinal = [];
    for (const item of tourListOne) {
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

      tourListOneFinal.push(itemFinal);
    }

    // Tour List Two
    const categoryIdTourListTwo = templateInfo?.dataTourListTwo;
    const categoryChildTourListTwo = await categoryHelper.getCategoryChild(
      categoryIdTourListTwo
    );
    const categoryChildIdTourListTwo = categoryChildTourListTwo.map(
      (item: any) => item.id
    );

    const categoryTourListTwo = await Category.findOne({
      _id: categoryIdTourListTwo,
      deleted: false,
      status: "active",
    });

    if (!categoryTourListTwo) {
      return res.status(404).json({ message: "Danh mục không tồn tại!" });
    }

    const categoryTwoFinal = {
      name: categoryTourListTwo.name,
      slug: categoryTourListTwo.slug,
    };

    const tourListTwo = await Tour.find({
      category: {
        $in: [categoryIdTourListTwo, ...categoryChildIdTourListTwo],
      },
      deleted: false,
      status: "active",
    })
      .sort({
        position: "desc",
      })
      .limit(8);

    const tourListTwoFinal = [];
    for (const item of tourListTwo) {
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

      tourListTwoFinal.push(itemFinal);
    }

    res.status(200).json({
      message: "Danh sách tour!",
      tourListOne: tourListOneFinal,
      categoryTourListOne: categoryOneFinal,
      tourListTwo: tourListTwoFinal,
      categoryTourListTwo: categoryTwoFinal,
    });
  } catch (error) {
    console.log("Lỗi khi gọi list", error);
    res.status(500).json({ message: "Lỗi hệ thống!" });
  }
};
