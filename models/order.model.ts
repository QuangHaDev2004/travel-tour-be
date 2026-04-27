import mongoose from "mongoose";

const schema = new mongoose.Schema(
  {
    orderCode: String,
    fullName: String,
    phone: String,
    email: String,
    note: String,
    items: Array,
    subTotal: Number,
    discount: Number,
    total: Number,
    paymentMethod: String,
    paymentStatus: String,
    status: String,
    confirmToken: String,
    confirmExpiresAt: Date,
    updatedBy: String,
    deleted: {
      type: Boolean,
      default: false,
    },
    deletedBy: String,
    deletedAt: Date,
  },
  {
    timestamps: true, // Tự động sinh ra trường createdAt và updatedAt
  },
);

const Order = mongoose.model("Order", schema, "orders");

export default Order;
