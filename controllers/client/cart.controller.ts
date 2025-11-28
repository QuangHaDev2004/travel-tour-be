import { Request, Response } from "express";
import Tour from "../../models/tour.model";
import City from "../../models/city.model";
import moment from "moment";

export const detail = async (req: Request, res: Response) => {
  try {
    const cart = req.body;
    const cartDetail = [];

    for (const item of cart) {
      const tourInfo = await Tour.findOne({
        _id: item.tourId,
        deleted: false,
        status: "active",
      });

      if (tourInfo) {
        const itemFinal = {
          tourId: item.tourId,
          quantityAdult: item.quantityAdult,
          quantityChildren: item.quantityChildren,
          quantityBaby: item.quantityBaby,
          checked: item.checked,
          avatar: tourInfo.avatar,
          name: tourInfo.name,
          locationsFromName: [],
          departureDateFormat: "",
          stockAdult: tourInfo.stockAdult,
          stockChildren: tourInfo.stockChildren,
          stockBaby: tourInfo.stockBaby,
          priceNewAdult: tourInfo.priceNewAdult,
          priceNewChildren: tourInfo.priceNewChildren,
          priceNewBaby: tourInfo.priceNewBaby,
          slug: tourInfo.slug,
        };

        if (tourInfo.locationsFrom.length > 0) {
          itemFinal.locationsFromName = await City.find({
            _id: { $in: tourInfo.locationsFrom },
          });
        }

        if (tourInfo.departureDate) {
          itemFinal.departureDateFormat = moment(tourInfo.departureDate).format(
            "DD/MM/YYYY"
          );
        }

        cartDetail.push(itemFinal);
      }
    }

    res.status(200).json({
      message: "Chi tiết giỏ hàng!",
      cart: cartDetail,
    });
  } catch (error) {
    console.log("Có lỗi khi gọi cart detail", error);
    res.status(500).json({ message: "Lỗi hệ thống!" });
  }
};
