import mongoose from "mongoose";

const schema = new mongoose.Schema(
  {
    email: String,
    deleted: {
      type: Boolean,
      default: false,
    },
    deletedBy: String,
    deletedAt: Date,
  },
  {
    timestamps: true, //createdAt, updatedAt
  }
);

const Contact = mongoose.model("Contact", schema, "contacts");

export default Contact;
