export const buildTimeFilter = (
  type: string,
  date?: any,
  month?: number,
  year?: number,
) => {
  const match: any = {
    deleted: false,
    paymentStatus: "paid",
  };

  if (type === "day") {
    const selectedDate = new Date(date);

    const start = new Date(selectedDate);
    start.setHours(0, 0, 0, 0);

    const end = new Date(selectedDate);
    end.setHours(23, 59, 59, 999);

    match.createdAt = { $gte: start, $lte: end };
  }

  if (type === "week") {
    const now = new Date();
    const day = now.getDay();

    const diff = day === 0 ? -6 : 1 - day;

    const firstDay = new Date(now);
    firstDay.setDate(now.getDate() + diff);
    firstDay.setHours(0, 0, 0, 0);

    const lastDay = new Date(firstDay);
    lastDay.setDate(firstDay.getDate() + 6);
    lastDay.setHours(23, 59, 59, 999);

    match.createdAt = { $gte: firstDay, $lte: lastDay };
  }

  if (type === "month" && month !== undefined && year !== undefined) {
    match.createdAt = {
      $gte: new Date(year, month - 1, 1),
      $lt: new Date(year, month, 1),
    };
  }

  if (type === "year" && year !== undefined) {
    match.createdAt = {
      $gte: new Date(year, 0, 1),
      $lt: new Date(year + 1, 0, 1),
    };
  }

  return match;
};
