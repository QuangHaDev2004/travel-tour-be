import { Response } from "express";
import { AccountRequest } from "../../interfaces/resquest.interface";
import AccountAdmin from "../../models/account-admin.model";
import Order from "../../models/order.model";

export const dashboard = async (req: AccountRequest, res: Response) => {
  try {
    const overview = {
      totalAdmin: 0,
      totalOrder: 0,
      totalRevenue: 0,
    };

    overview.totalAdmin = await AccountAdmin.countDocuments({
      deleted: false,
    });

    const orderList = await Order.find({
      deleted: false,
    });

    overview.totalOrder = orderList.length;
    overview.totalRevenue = orderList?.reduce(
      (acc, item) => acc + (item.total ?? 0),
      0
    );

    res.status(200).json({ overview });
  } catch (error) {
    console.log("Có lỗi khi gọi dashboard", error);
    res.status(500).json({ message: "Lỗi hệ thống!" });
  }
};

export const revenueChartPost = async (req: AccountRequest, res: Response) => {
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
