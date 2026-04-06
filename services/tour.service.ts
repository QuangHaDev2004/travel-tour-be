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

  // tìm theo điểm đến
  if (intent.locationTo) {
    const cities = await City.find({
      name: {
        $regex: intent.locationTo,
        $options: "i",
      },
    });

    const ids = cities.map((c) => c._id);
    console.log("IDs: ", ids);
    

    if (ids.length > 0) {
      query.locationsTo = { $in: ids };
    } else {
      intent.keyword = intent.locationTo;
      intent.locationTo = "";
    }
  }

  // tìm theo từ khóa
  if (intent.keyword) {
    const keyword = intent.keyword;

    // nếu đã có query trước đó → cần merge thêm $or
    if (!query.$or) {
      query.$or = [];
    }

    query.$or.push(
      { name: { $regex: keyword, $options: "i" } },
      { "schedules.description": { $regex: keyword, $options: "i" } },
    );
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

  // nếu có cả location + keyword thì ưu tiên AND logic
  if (intent.locationTo && intent.keyword) {
    query.$and = [
      {
        $or: [
          { name: { $regex: intent.keyword, $options: "i" } },
          {
            "schedules.description": { $regex: intent.keyword, $options: "i" },
          },
        ],
      },
    ];
  }

  console.log("Intent in searchTours: ", intent);

  return await Tour.find(query).limit(5);
};
