import { Request, Response } from "express";
import Order from "../../models/order.model";
import Tour from "../../models/tour.model";
import {
  paymentMethodList,
  paymentStatusList,
  statusList,
} from "../../config/variable.config";
import moment from "moment";
import City from "../../models/city.model";

export const list = async (req: Request, res: Response) => {
  try {
    const orderList = await Order.find({
      deleted: false,
    }).sort({
      createdAt: "desc",
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

export const edit = async (req: Request, res: Response) => {
  try {
    const id = req.params.id;

    const record = await Order.findOne({
      _id: id,
      deleted: false,
    });

    if (!record) {
      return res.status(404).json({ message: "Đơn hàng không tồn tại!" });
    }

    const createdAtFormat =
      moment(record.createdAt).format("YYYY-MM-DDTHH:mm") ?? "";

    const itemsFinal = [];
    for (const item of record.items) {
      const tourInfo = await Tour.findOne({
        _id: item.tourId,
      });

      const cityInfo = await City.find({
        _id: { $in: tourInfo?.locationsFrom },
      });

      const locationsFromName =
        cityInfo.map((item) => item.name).join(", ") ?? "";

      const avatar = tourInfo?.avatar ?? "";
      const name = tourInfo?.name ?? "";
      const departureDateFormat =
        moment(item.departureDate).format("DD/MM/YYYY") ?? "";

      itemsFinal.push({
        tourId: item.tourId,
        quantityAdult: item.quantityAdult,
        quantityChildren: item.quantityChildren,
        quantityBaby: item.quantityBaby,
        priceNewAdult: item.priceNewAdult,
        priceNewChildren: item.priceNewChildren,
        priceNewBaby: item.priceNewBaby,
        avatar,
        name,
        departureDateFormat,
        locationsFromName,
      });
    }

    const orderDetail = {
      orderCode: record.orderCode,
      fullName: record.fullName,
      phone: record.phone,
      note: record.note,
      paymentMethod: record.paymentMethod,
      paymentStatus: record.paymentStatus,
      status: record.status,
      subTotal: record.subTotal,
      discount: record.discount,
      total: record.total,
      createdAtFormat,
      items: itemsFinal,
    };

    res.status(200).json({ orderDetail });
  } catch (error) {
    console.log("Có lỗi khi gọi order edit", error);
    res.status(500).json({ message: "Lỗi hệ thống!" });
  }
};

export const editPatch = async (req: Request, res: Response) => {
  try {
    const id = req.params.id;

    await Order.updateOne(
      {
        _id: id,
        deleted: false,
      },
      req.body
    );

    res.status(200).json({ message: "Cập nhật đơn hàng thành công!" });
  } catch (error) {
    console.log("Có lỗi khi gọi order editPatch", error);
    res.status(500).json({ message: "Lỗi hệ thống!" });
  }
};
