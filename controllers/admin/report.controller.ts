import { Request, Response } from "express";
import Order from "../../models/order.model";
import { fillMissingData } from "../../utils/fillMissingData";
import { buildTimeFilter } from "../../helpers/buildTimeFilter.helper";

/**
 * Doanh thu
 * type: day | week | month | year
 */
export const revenueReport = async (req: Request, res: Response) => {
  try {
    const { type, date, month, year } = req.body;

    // fiter chung
    const match: any = {
      deleted: false,
      paymentStatus: "paid",
    };

    let groupFormat: any;

    // theo ngày
    if (type === "day") {
      const selectedDate = new Date(date);

      const start = new Date(selectedDate);
      start.setHours(0, 0, 0, 0);

      const end = new Date(selectedDate);
      end.setHours(23, 59, 59, 999);

      match.createdAt = {
        $gte: start, // >= 00:00
        $lte: end, // <= 23:59
      };

      // group theo giờ (0 → 23)
      groupFormat = {
        $hour: {
          date: "$createdAt",
          timezone: "Asia/Ho_Chi_Minh",
        },
      };
    }

    // theo tuần
    if (type === "week") {
      const now = new Date();
      const day = now.getDay(); // 0 (CN) → 6 (T7)

      // convert: T2 = 0, CN = 6
      const diff = day === 0 ? -6 : 1 - day;

      const firstDay = new Date(now);
      firstDay.setDate(now.getDate() + diff);
      firstDay.setHours(0, 0, 0, 0);

      const lastDay = new Date(firstDay);
      lastDay.setDate(firstDay.getDate() + 6);
      lastDay.setHours(23, 59, 59, 999);

      match.createdAt = {
        $gte: firstDay,
        $lte: lastDay,
      };

      // 1 (CN) → 7 (T7)
      groupFormat = {
        $dayOfWeek: {
          date: "$createdAt",
          timezone: "Asia/Ho_Chi_Minh",
        },
      };
    }

    // theo tháng
    if (type === "month") {
      match.createdAt = {
        $gte: new Date(year, month - 1, 1),
        $lt: new Date(year, month, 1),
      };

      // 1 → 31
      groupFormat = {
        $dayOfMonth: {
          date: "$createdAt",
          timezone: "Asia/Ho_Chi_Minh",
        },
      };
    }

    // theo năm
    if (type === "year") {
      match.createdAt = {
        $gte: new Date(year, 0, 1),
        $lt: new Date(year + 1, 0, 1),
      };

      // 1 → 12
      groupFormat = {
        $month: {
          date: "$createdAt",
          timezone: "Asia/Ho_Chi_Minh",
        },
      };
    }

    const raw = await Order.aggregate([
      { $match: match }, // lọc dữ liệu
      {
        $group: {
          _id: groupFormat, // group theo thời gian
          totalRevenue: { $sum: "$total" }, // tính tổng tiền
        },
      },
      // Format dữ liệu trả về
      {
        $project: {
          id: "$_id",
          totalRevenue: 1, // giữ nguyên
          _id: 0, // ẩn _id
        },
      },
      { $sort: { id: 1 } }, // sort theo time
    ]);

    const result = fillMissingData(raw, type, date, month, year);

    res.json(result);
  } catch (error) {
    console.log("Lỗi khi gọi revenueReport.", error);
    res.status(500).json({ message: "Lỗi hệ thống." });
  }
};

/**
 * Lấy top 5 tour bán chạy theo số lượng
 * Author: QuangHaDev 01.04.2026
 */
export const topTourQuantity = async (req: Request, res: Response) => {
  try {
    const { type, date, month, year } = req.body;
    const match = buildTimeFilter(type, date, month, year);

    const result = await Order.aggregate([
      { $match: match },
      { $unwind: "$items" },

      {
        $addFields: {
          totalItemQuantity: {
            $add: [
              { $ifNull: ["$items.quantityAdult", 0] },
              { $ifNull: ["$items.quantityChildren", 0] },
              { $ifNull: ["$items.quantityBaby", 0] },
            ],
          },
        },
      },

      {
        $group: {
          _id: "$items.tourId",
          totalQuantity: { $sum: "$totalItemQuantity" },
        },
      },

      {
        $addFields: {
          tourObjectId: { $toObjectId: "$_id" },
        },
      },

      {
        $lookup: {
          from: "tours",
          localField: "tourObjectId",
          foreignField: "_id",
          as: "tour",
        },
      },

      { $unwind: "$tour" },

      { $sort: { totalQuantity: -1 } },
      { $limit: 5 },

      {
        $project: {
          _id: 0, // ẩn
          tourId: "$_id",
          tourName: "$tour.name",
          totalQuantity: 1,
        },
      },
    ]);

    res.json({ topTourQuantity: result });
  } catch (error) {
    console.log("Lỗi khi gọi topTourQuantity.", error);
    res.status(500).json({ message: "Lỗi hệ thống." });
  }
};

/**
 * Lấy top 5 tour bán chạy theo doanh thu
 * Author: QuangHaDev 01.04.2026
 */
export const topTourRevenue = async (req: Request, res: Response) => {
  try {
    const { type, date, month, year } = req.body;
    const match = buildTimeFilter(type, date, month, year);

    const result = await Order.aggregate([
      { $match: match },
      { $unwind: "$items" },

      {
        $addFields: {
          totalItemRevenue: {
            $add: [
              {
                $multiply: [
                  { $ifNull: ["$items.quantityAdult", 0] },
                  { $ifNull: ["$items.priceNewAdult", 0] },
                ],
              },
              {
                $multiply: [
                  { $ifNull: ["$items.quantityChildren", 0] },
                  { $ifNull: ["$items.priceNewChildren", 0] },
                ],
              },
              {
                $multiply: [
                  { $ifNull: ["$items.quantityBaby", 0] },
                  { $ifNull: ["$items.priceNewBaby", 0] },
                ],
              },
            ],
          },
        },
      },

      {
        $group: {
          _id: "$items.tourId",
          totalRevenue: { $sum: "$totalItemRevenue" },
        },
      },

      {
        $addFields: {
          tourObjectId: { $toObjectId: "$_id" },
        },
      },

      {
        $lookup: {
          from: "tours",
          localField: "tourObjectId",
          foreignField: "_id",
          as: "tour",
        },
      },

      { $unwind: "$tour" },

      { $sort: { totalRevenue: -1 } },
      { $limit: 5 },

      {
        $project: {
          _id: 0,
          tourId: "$_id",
          tourName: "$tour.name",
          totalRevenue: 1,
        },
      },
    ]);

    res.json({ topTourRevenue: result });
  } catch (error) {
    console.log("Lỗi khi gọi topTourRevenue:", error);
    res.status(500).json({ message: "Lỗi hệ thống." });
  }
};
