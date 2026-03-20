import City from "../models/city.model";

export const mapCity = async (tours: any) => {
  // tạo Set để lưu ID không trùng
  const ids = new Set<string>();

  // lấy tất cả cityId từ tours
  tours.forEach((t: any) => {
    t.locationsTo?.forEach((id: string) => ids.add(id));
  });

  const cities = await City.find({
    _id: { $in: Array.from(ids) },
  });

  const map: any = {};
  cities.forEach((c) => {
    map[c._id.toString()] = c.name;
  });

  return tours.map((t: any) => ({
    ...t.toObject(),
    locationsToName: t.locationsTo.map((id: string) => map[id.toString()]),
  }));
};
