import { Request, Response } from "express";
import Tour from "../../models/tour.model";
import Category from "../../models/category.model";
import City from "../../models/city.model";
import moment from "moment";

export const detail = async (req: Request, res: Response) => {
  try {
    const slug = req.params.slug;

    const tourDetail = await Tour.findOne({
      slug: slug,
      deleted: false,
      status: "active",
    });

    if (!tourDetail) {
      return res.status(404).json({ message: "Tour không tồn tại!" });
    }

    // Breadcrumb
    const breadcrumb = [];

    if (tourDetail.category) {
      const category = await Category.findOne({
        _id: tourDetail.category,
        deleted: false,
        status: "active",
      });

      if (category) {
        breadcrumb.push({
          id: category.id,
          name: category.name,
          slug: category.slug,
          avatar: category.avatar,
        });
      }
    }

    breadcrumb.push({
      id: tourDetail.id,
      name: tourDetail.name,
      slug: tourDetail.slug,
      avatar: tourDetail.avatar,
    });

    // Tour Detail
    const dataFinal = {
      id: tourDetail.id,
      images: tourDetail.images,
      avatar: tourDetail.avatar,
      name: tourDetail.name,
      tourCode: tourDetail.tourCode,
      time: tourDetail.time,
      vehicle: tourDetail.vehicle,
      stockAdult: tourDetail.stockAdult,
      stockChildren: tourDetail.stockChildren,
      stockBaby: tourDetail.stockBaby,
      priceNewAdult: tourDetail.priceNewAdult,
      priceNewChildren: tourDetail.priceNewChildren,
      priceNewBaby: tourDetail.priceNewBaby,
      information: tourDetail.information,
      schedules: tourDetail.schedules,
      locationsFromName: [],
      departureDateFormat: "",
    };

    if (tourDetail.locationsFrom.length > 0) {
      dataFinal.locationsFromName = await City.find({
        _id: { $in: tourDetail.locationsFrom },
      });
    }

    if (tourDetail.departureDate) {
      dataFinal.departureDateFormat = moment(tourDetail.departureDate).format(
        "DD/MM/YYYY"
      );
    }

    res.status(200).json({
      message: "Chi tiết tour!",
      breadcrumb,
      tourDetail: dataFinal,
    });
  } catch (error) {
    console.log("Lỗi khi gọi tour detail!", error);
    res.status(500).json({ message: "Lỗi hệ thống!" });
  }
};
