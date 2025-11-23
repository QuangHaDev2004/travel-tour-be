import mongoose from "mongoose";

const schema = new mongoose.Schema(
  {
    tourCode: String,
    name: String,
    category: String,
    position: Number,
    status: String,
    avatar: String,
    images: [String],
    priceAdult: Number,
    priceChildren: Number,
    priceBaby: Number,
    priceNewAdult: Number,
    priceNewChildren: Number,
    priceNewBaby: Number,
    stockAdult: Number,
    stockChildren: Number,
    stockBaby: Number,
    locationsFrom: [String],
    locationsTo: [String],
    time: String,
    vehicle: String,
    departureDate: Date,
    information: String,
    schedules: Array,
    createdBy: String,
    updatedBy: String,
    slug: String,
    deleted: {
      type: Boolean,
      default: false,
    },
    deletedBy: String,
    deletedAt: Date,
  },
  {
    timestamps: true, // createAt, updatedAt
  }
);

const Tour = mongoose.model("Tour", schema, "tours");

export default Tour;
