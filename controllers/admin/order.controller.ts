import { Request, Response } from "express";
import Order from "../../models/order.model";
import Tour from "../../models/tour.model";
import {
  paymentMethodList,
  paymentStatusList,
  statusList,
} from "../../config/variable.config";
import moment from "moment";

export const list = async (req: Request, res: Response) => {
  try {
    const orderList = await Order.find({
      deleted: false,
    });

    const dataFinal = [];
    for (const orderDetail of orderList) {
      const itemsFinal = [];

      for (const item of orderDetail.items) {
        const tourInfo = await Tour.findOne({
          _id: item.tourId,
        });

        if (tourInfo) {
          itemsFinal.push({
            tourId: item.tourId,
            quantityAdult: item.quantityAdult,
            quantityChildren: item.quantityChildren,
            quantityBaby: item.quantityBaby,
            priceNewAdult: item.priceNewAdult,
            priceNewChildren: item.priceNewChildren,
            priceNewBaby: item.priceNewBaby,
            avatar: tourInfo.avatar,
            name: tourInfo.name,
          });
        }
      }

      const paymentMethodName =
        paymentMethodList.find(
          (item) => item.value === orderDetail.paymentMethod
        )?.label ?? "";

      const paymentStatusName =
        paymentStatusList.find(
          (item) => item.value === orderDetail.paymentStatus
        )?.label ?? "";

      const statusInfo =
        statusList.find((item) => item.value === orderDetail.status) ?? {};

      const createdAtTime = moment(orderDetail.createdAt).format("HH:mm") ?? "";
      const createdAtDate =
        moment(orderDetail.createdAt).format("DD/MM/YYYY") ?? "";

      dataFinal.push({
        id: orderDetail.id,
        orderCode: orderDetail.orderCode,
        fullName: orderDetail.fullName,
        phone: orderDetail.phone,
        note: orderDetail.note,
        subTotal: orderDetail.subTotal,
        discount: orderDetail.discount,
        total: orderDetail.total,
        items: itemsFinal,
        paymentMethodName,
        paymentStatusName,
        statusInfo,
        createdAtTime,
        createdAtDate,
      });
    }

    res.status(200).json({ orderList: dataFinal });
  } catch (error) {
    console.log("Có lỗi khi gọi order list", error);
    res.status(500).json({ message: "Lỗi hệ thống!" });
  }
};
