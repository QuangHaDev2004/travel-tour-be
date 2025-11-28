import { Request, Response } from "express";
import { generateRandomNumber } from "../../helpers/generate.helper";
import Tour from "../../models/tour.model";
import Order from "../../models/order.model";

export const createPost = async (req: Request, res: Response) => {
  try {
    req.body.orderCode = "OD" + generateRandomNumber(10);

    req.body.subTotal = 0;

    for (const item of req.body.items) {
      const itemInfo = await Tour.findOne({
        _id: item.tourId,
        deleted: false,
        status: "active",
      });

      if (itemInfo) {
        item.priceNewAdult = itemInfo.priceNewAdult;
        item.priceNewChildren = itemInfo.priceNewChildren;
        item.priceNewBaby = itemInfo.priceNewBaby;
        item.departureDate = itemInfo.departureDate;

        req.body.subTotal +=
          item.priceNewAdult * item.quantityAdult +
          item.priceNewChildren * item.quantityChildren +
          item.priceNewBaby * item.quantityBaby;

        if (
          itemInfo.stockAdult == null ||
          itemInfo.stockChildren == null ||
          itemInfo.stockBaby == null
        ) {
          throw new Error("Số lượng không hợp lệ!");
        }

        await Tour.updateOne(
          {
            _id: item.tourId,
          },
          {
            stockAdult: itemInfo.stockAdult - item.quantityAdult,
            stockChildren: itemInfo.stockChildren - item.quantityChildren,
            stockBaby: itemInfo.stockBaby - item.quantityBaby,
          }
        );
      }
    }

    req.body.discount = 0;

    req.body.total = req.body.subTotal - req.body.discount;

    req.body.paymentStatus = "unpaid";

    req.body.status = "initial";

    const newRecord = new Order(req.body);
    await newRecord.save();

    res.status(201).json({
      message: "Chúc mừng bạn đã đặt tour thành công!",
      orderCode: req.body.orderCode,
    });
  } catch (error) {
    console.log("Có lỗi khi gọi order createPost", error);
    res.status(500).json({ message: "Lỗi hệ thống!" });
  }
};
