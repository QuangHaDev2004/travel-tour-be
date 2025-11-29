import { Request, Response } from "express";
import { generateRandomNumber } from "../../helpers/generate.helper";
import Tour from "../../models/tour.model";
import Order from "../../models/order.model";
import City from "../../models/city.model";
import moment from "moment";
import {
  paymentMethodList,
  paymentStatusList,
  statusList,
} from "../../config/variable.config";

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

export const success = async (req: Request, res: Response) => {
  try {
    const { orderCode, phone } = req.query;

    const orderDetail = await Order.findOne({
      orderCode: orderCode,
      phone: phone,
    });

    if (!orderDetail) {
      return res.status(404).json({ message: "Đơn hàng không tồn tại!" });
    }

    const dataFinal = {
      orderCode: orderDetail.orderCode,
      fullName: orderDetail.fullName,
      phone: orderDetail.phone,
      note: orderDetail.note,
      subTotal: orderDetail.subTotal,
      discount: orderDetail.discount,
      total: orderDetail.total,
      createdAtFormat: "",
      paymentMethodName: "",
      paymentStatusName: "",
      statusName: "",
      items: [] as any,
    };

    if (orderDetail.createdAt) {
      dataFinal.createdAtFormat = moment(orderDetail.createdAt).format(
        "HH:mm - DD/MM/YYYY"
      );
    }

    if (orderDetail.paymentMethod) {
      dataFinal.paymentMethodName =
        paymentMethodList.find(
          (item) => item.value === orderDetail.paymentMethod
        )?.label ?? "";
    }

    if (orderDetail.paymentStatus) {
      dataFinal.paymentStatusName =
        paymentStatusList.find(
          (item) => item.value === orderDetail.paymentStatus
        )?.label ?? "";
    }

    if (orderDetail.status) {
      dataFinal.statusName =
        statusList.find((item) => item.value === orderDetail.status)?.label ??
        "";
    }

    if (orderDetail.items && orderDetail.items.length > 0) {
      for (const item of orderDetail.items) {
        const itemFinal = {
          tourId: item.tourId,
          quantityAdult: item.quantityAdult,
          quantityChildren: item.quantityChildren,
          quantityBaby: item.quantityBaby,
          priceNewAdult: item.priceNewAdult,
          priceNewChildren: item.priceNewChildren,
          priceNewBaby: item.priceNewBaby,
          departureDateFormat: "",
          avatar: "",
          name: "",
          slug: "",
          locationsFromFormat: "",
        };

        if (item.departureDate) {
          itemFinal.departureDateFormat = moment(item.departureDate).format(
            "DD/MM/YYYY"
          );
        }

        const tourInfo = await Tour.findOne({
          _id: item.tourId,
          deleted: false,
          status: "active",
        });

        if (tourInfo) {
          itemFinal.avatar = tourInfo.avatar as string;
          itemFinal.name = tourInfo.name as string;
          itemFinal.slug = tourInfo.slug as string;

          // sửa lại nếu có chọn điểm khởi hành
          const cityInfo = await City.find({
            _id: { $in: tourInfo.locationsFrom },
          });
          itemFinal.locationsFromFormat = cityInfo
            .map((item) => item.name)
            .join(", ");
        }

        dataFinal.items.push(itemFinal);
      }
    }

    res.status(200).json({ orderDetail: dataFinal });
  } catch (error) {
    console.log("Có lỗi khi gọi order success", error);
    res.status(500).json({ message: "Lỗi hệ thống!" });
  }
};
