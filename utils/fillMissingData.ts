export const fillMissingData = (
  data: any[],
  type: string,
  date?: any,
  month?: number,
  year?: number,
) => {
  const map = new Map(data.map((item) => [item.id, item.totalRevenue]));

  let result: any[] = [];

  if (type === "day") {
    for (let i = 0; i < 24; i++) {
      result.push({
        id: i,
        totalRevenue: map.get(i) || 0,
      });
    }
  }

  if (type === "week") {
    for (let i = 1; i <= 7; i++) {
      result.push({
        id: i,
        totalRevenue: map.get(i) || 0,
      });
    }
  }

  if (type === "month") {
    if (!year || !month) {
      throw new Error("Missing month or year");
    }

    const daysInMonth = new Date(year, month, 0).getDate();

    for (let i = 1; i <= daysInMonth; i++) {
      result.push({
        id: i,
        totalRevenue: map.get(i) || 0,
      });
    }
  }

  if (type === "year") {
    for (let i = 1; i <= 12; i++) {
      result.push({
        id: i,
        totalRevenue: map.get(i) || 0,
      });
    }
  }

  return result;
};
