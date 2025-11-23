import { Request, Response } from "express";
import City from "../../models/city.model";

export const list = async (req: Request, res: Response) => {
  const cityList = await City.find({})
    .sort({
      name: "asc",
    })
    .collation({ locale: "vi" });

  res.status(200).json({
    message: "Danh sách thành phố!",
    cityList: cityList,
  });
};
