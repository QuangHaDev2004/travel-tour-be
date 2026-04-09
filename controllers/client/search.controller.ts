import { Request, Response } from "express";
import Tour from "../../models/tour.model";
import City from "../../models/city.model";
import moment from "moment";
import slugify from "slugify";

/**
 * Lấy danh sách Tour kết hợp bộ lọc tìm kiếm nâng cao.
 * @author QuangHaDev - 26.11.2025
 */
export const list = async (req: Request, res: Response) => {
  try {
    const find: any = {
      deleted: false,
      status: "active",
    };

    // Từ khóa
    if (req.query.keyword) {
      const keyword = slugify(req.query.keyword as string);
      const keywordRegex = new RegExp(keyword, "i");
      find.slug = keywordRegex;
    }

    // Khoảng giá
    if (req.query.price) {
      const [priceMin, priceMax] = (req.query.price as string)
        .split("-")
        .map((item: string) => parseInt(item));

      find.priceNewAdult = {
        $gte: priceMin,
        $lte: priceMax,
      };
    }

    // Điểm đi
    if (req.query.locationFrom) {
      find.locationsFrom = { $in: req.query.locationFrom };
    }

    // Điểm đến
    if (req.query.locationTo) {
      find.locationsTo = { $in: req.query.locationTo };
    }

    // Ngày khởi hành
    if (req.query.departureDate) {
      const date = new Date(req.query.departureDate as string);
      find.departureDate = date;
    }

    // Sắp xếp theo tiêu chí
    let sort: any = {};
    if (req.query.sortKey && req.query.sortValue) {
      sort[`${req.query.sortKey}`] = req.query.sortValue;
    } else {
      sort.position = "desc";
    }

    // Phân trang
    const limitItems = 6;
    let page = 1;
    if (req.query.page && parseInt(`${req.query.page}`) > 0) {
      page = parseInt(`${req.query.page}`);
    }
    const skip = (page - 1) * limitItems;
    const totalRecord = await Tour.countDocuments(find);
    const totalPage = Math.ceil(totalRecord / limitItems);
    const pagination = {
      skip: skip,
      totalRecord: totalRecord,
      totalPage: totalPage,
      currentPage: page,
    };

    // Danh sách tour
    const tourList = await Tour.find(find)
      .sort(sort)
      .skip(skip)
      .limit(limitItems);

    const dataFinal = [];
    for (const item of tourList) {
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
          ((item.priceAdult - item.priceNewAdult) / item.priceAdult) * 100,
        );
      }

      if (item.locationsFrom.length > 0) {
        itemFinal.locationsFromName = await City.find({
          _id: { $in: item.locationsFrom },
        });
      }

      if (item.departureDate) {
        itemFinal.departureDateFormat = moment(item.departureDate).format(
          "DD/MM/YYYY",
        );
      }

      dataFinal.push(itemFinal);
    }

    res.status(200).json({
      tourList: dataFinal,
      pagination,
    });
  } catch (error) {
    console.log("Lỗi khi gọi list", error);
    res.status(500).json({ message: "Lỗi hệ thống." });
  }
};
