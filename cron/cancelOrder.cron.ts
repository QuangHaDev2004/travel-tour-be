import cron from "node-cron";
import Order from "../models/order.model";

export const startCancelOrderJob = () => {
  // chạy mỗi 5 phút
  cron.schedule("*/5 * * * *", async () => {
    try {
      console.log("Running auto cancel order job...");

      const result = await Order.updateMany(
        {
          status: "pending_confirm",
          confirmExpiresAt: { $lt: new Date() },
          deleted: false,
        },
        {
          status: "cancel_expired",
        },
      );

      console.log(`Auto cancelled: ${result.modifiedCount} orders`);
    } catch (error) {
      console.log("Cron cancel order error:", error);
    }
  });
};
