import { Request, Response } from "express";
import Order from "../../models/order.model";
import AccountAdmin from "../../models/account-admin.model";
import Tour from "../../models/tour.model";
import {
  paymentMethodList,
  paymentStatusList,
  statusList,
} from "../../config/variable.config";
import moment from "moment";

export const dashboard = async (req: Request, res: Response) => {
  try {
    const overview = {
      totalAdmin: {
        value: 0,
        growth: 0,
      },
      totalOrder: {
        value: 0,
        growth: 0,
      },
      totalRevenue: {
        value: 0,
        growth: 0,
      },
    };

    overview.totalAdmin.value = await AccountAdmin.countDocuments({
      deleted: false,
    });

    const now = new Date();
    const currentMonth = now.getMonth() + 1;
    const currentYear = now.getFullYear();

    const previousMonthDate = new Date(currentYear, now.getMonth() - 1, 1);
    const previousMonth = previousMonthDate.getMonth() + 1;
    const previousYear = previousMonthDate.getFullYear();

    const orderCurrentMonth = await Order.find({
      deleted: false,
      createdAt: {
        $gte: new Date(currentYear, currentMonth - 1, 1),
        $lt: new Date(currentYear, currentMonth, 1),
      },
    });

    const orderPreviousMonth = await Order.find({
      deleted: false,
      createdAt: {
        $gte: new Date(previousYear, previousMonth - 1, 1),
        $lt: new Date(previousYear, previousMonth, 1),
      },
    });

    // Revenue
    const totalRevenueCurrent = orderCurrentMonth.reduce((acc, item) => {
      if (item.status === "cancel") return acc;
      return acc + (item.total ?? 0);
    }, 0);

    const totalRevenuePrevious = orderPreviousMonth.reduce((acc, item) => {
      if (item.status === "cancel") return acc;
      return acc + (item.total ?? 0);
    }, 0);

    if (totalRevenuePrevious > 0) {
      const percent = Math.round(
        ((totalRevenueCurrent - totalRevenuePrevious) / totalRevenuePrevious) *
          100
      );
      overview.totalRevenue.growth = percent;
    }
    overview.totalRevenue.value = totalRevenueCurrent;

    // Order
    const totalOrderCurrent = orderCurrentMonth.length;
    const totalOrderPrevious = orderPreviousMonth.length;
    if (totalOrderPrevious > 0) {
      const percent = Math.round(
        ((totalOrderCurrent - totalOrderPrevious) / totalOrderPrevious) * 100
      );
      overview.totalOrder.growth = percent;
    }
    overview.totalOrder.value = totalOrderCurrent;

    // Order New
    const orderNew = await Order.find({
      deleted: false,
    })
      .sort({
        createdAt: "desc",
      })
      .limit(5);

    const dataFinal = [];
    for (const order of orderNew) {
      const itemFinal = [];
      for (const item of order.items) {
        const tourInfo = await Tour.findOne({
          _id: item.tourId,
        });

        if (tourInfo) {
          itemFinal.push({
            tourId: item.tourId,
            avatar: tourInfo.avatar,
            name: tourInfo.name,
            quantityAdult: item.quantityAdult,
            quantityChildren: item.quantityChildren,
            quantityBaby: item.quantityBaby,
            priceNewAdult: item.priceNewAdult,
            priceNewChildren: item.priceNewChildren,
            priceNewBaby: item.priceNewBaby,
          });
        }
      }

      const paymentMethodName =
        paymentMethodList.find((item) => item.value === order.paymentMethod)
          ?.label ?? "";

      const paymentStatusName =
        paymentStatusList.find((item) => item.value === order.paymentStatus)
          ?.label ?? "";

      const statusInfo =
        statusList.find((item) => item.value === order.status) ?? {};

      const createdAtTime = moment(order.createdAt).format("HH:mm") ?? "";
      const createdAtDate = moment(order.createdAt).format("DD/MM/YYYY") ?? "";

      dataFinal.push({
        id: order.id,
        orderCode: order.orderCode,
        fullName: order.fullName,
        phone: order.phone,
        note: order.note || "Không có",
        subTotal: order.subTotal,
        discount: order.discount,
        total: order.total,
        items: itemFinal,
        paymentMethodName,
        paymentStatusName,
        statusInfo,
        createdAtTime,
        createdAtDate,
      });
    }

    res.status(200).json({ overview, orderNew: dataFinal });
  } catch (error) {
    console.log("Lỗi khi gọi dashboard", error);
    res.status(500).json({ message: "Lỗi hệ thống!" });
  }
};

export const revenueChartPost = async (req: Request, res: Response) => {
  try {
    const { currentMonth, currentYear, previousMonth, previousYear, arrayDay } =
      req.body;

    // Tất cả đơn hàng tháng hiện tại
    const orderCurrentMonth = await Order.find({
      deleted: false,
      createdAt: {
        $gte: new Date(currentYear, currentMonth - 1, 1),
        $lt: new Date(currentYear, currentMonth, 1),
      },
    });

    // Tất cả đơn hàng tháng trước
    const orderPreviousMonth = await Order.find({
      deleted: false,
      createdAt: {
        $gte: new Date(previousYear, previousMonth - 1, 1),
        $lt: new Date(previousYear, previousMonth, 1),
      },
    });

    // Tạo mảng doanh thu theo ngày
    const dataMonthCurrent = [];
    const dataMonthPrevious = [];

    for (const day of arrayDay) {
      let revenueCurrent = 0;
      for (const order of orderCurrentMonth) {
        const orderDate = new Date(order.createdAt).getDate();
        if (orderDate === day) revenueCurrent += order.total ?? 0;
      }
      dataMonthCurrent.push(revenueCurrent);

      let revenuePrevious = 0;
      for (const order of orderPreviousMonth) {
        const orderDate = new Date(order.createdAt).getDate();
        if (orderDate === day) revenuePrevious += order.total ?? 0;
      }
      dataMonthPrevious.push(revenuePrevious);
    }

    res.status(200).json({ dataMonthCurrent, dataMonthPrevious });
  } catch (error) {
    console.log("Có lỗi khi gọi revenueChartPost", error);
    res.status(500).json({ message: "Lỗi hệ thống!" });
  }
};

// export const test = async (req: AccountRequest, res: Response) => {
//   res.sendStatus(204);
// };
