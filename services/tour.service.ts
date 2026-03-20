import City from "../models/city.model";
import Tour from "../models/tour.model";

/**
 * Hàm tìm kiếm tour dựa trên ý định đã phân tích từ AI
 * @param intent - Đối tượng chứa destination, days, budget...
 */
export const searchTours = async (intent: any) => {
  const query: any = {
    deleted: false,
    status: "active",
  };

  // tìm city
  if (intent.locationTo) {
    const cities = await City.find({
      name: {
        $regex: intent.locationTo,
        $options: "i",
      },
    });

    const ids = cities.map((c) => c._id);

    if (ids.length > 0) {
      query.locationsTo = { $in: ids };
    }
  }

  if (intent.days) {
    query.time = { $regex: intent.days, $options: "i" };
  }

  if (intent.vehicle) {
    query.vehicle = { $regex: intent.vehicle, $options: "i" };
  }

  if (intent.price) {
    query.priceNewAdult = {
      $lte: intent.price, // nhỏ hơn hoặc bằng
    };
  }

  return await Tour.find(query).limit(5);
};
