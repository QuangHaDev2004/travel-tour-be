import { Response } from "express";
import Tour from "../../models/tour.model";
import { AccountRequest } from "../../interfaces/resquest.interface";
import slugify from "slugify";
import { generateRandomNumber } from "../../helpers/generate.helper";
import { formatDateDDMMYY } from "../../helpers/date.helper";

export const createPost = async (req: AccountRequest, res: Response) => {
  try {
    req.body.tourCode = `NQHTOUR-${generateRandomNumber(6)}-${formatDateDDMMYY(
      new Date()
    )}`;

    if (req.body.position) {
      req.body.position = parseInt(req.body.position);
    } else {
      const totalRecord = await Tour.countDocuments({});
      req.body.position = totalRecord + 1;
    }

    req.body.priceAdult = req.body.priceAdult
      ? parseInt(req.body.priceAdult)
      : 0;
    req.body.priceChildren = req.body.priceChildren
      ? parseInt(req.body.priceChildren)
      : 0;
    req.body.priceBaby = req.body.priceBaby ? parseInt(req.body.priceBaby) : 0;

    req.body.priceNewAdult = req.body.priceNewAdult
      ? parseInt(req.body.priceNewAdult)
      : req.body.priceAdult;
    req.body.priceNewChildren = req.body.priceNewChildren
      ? parseInt(req.body.priceNewChildren)
      : req.body.priceChildren;
    req.body.priceNewBaby = req.body.priceNewBaby
      ? parseInt(req.body.priceNewBaby)
      : req.body.priceBaby;

    req.body.stockAdult = req.body.stockAdult
      ? parseInt(req.body.stockAdult)
      : 0;
    req.body.stockChildren = req.body.stockChildren
      ? parseInt(req.body.stockChildren)
      : 0;
    req.body.stockBaby = req.body.stockBaby ? parseInt(req.body.stockBaby) : 0;

    req.body.locationsFrom = req.body.locationsFrom
      ? JSON.parse(req.body.locationsFrom)
      : [];
    req.body.locationsTo = req.body.locationsTo
      ? JSON.parse(req.body.locationsTo)
      : [];
    req.body.departureDate = req.body.departureDate
      ? new Date(req.body.departureDate)
      : null;
    req.body.schedules = req.body.schedules
      ? JSON.parse(req.body.schedules)
      : [];

    req.body.slug = slugify(req.body.name, { lower: true });
    req.body.createdBy = req.account.id;
    req.body.updatedBy = req.account.id;
    req.body.avatar = req.file ? req.file.path : "";

    const newRecord = new Tour(req.body);
    await newRecord.save();

    res.status(201).json({ message: "Tạo tour thành công!" });
  } catch (error) {
    console.log("Lỗi khi gọi createPost", error);
    res.status(500).json({ message: "Lỗi hệ thống!" });
  }
};
