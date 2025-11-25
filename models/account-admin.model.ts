import mongoose from "mongoose";

const schema = new mongoose.Schema(
  {
    fullName: String,
    email: String,
    phone: String,
    role: String,
    positionCompany: String,
    status: String,
    password: String,
    avatar: String,
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
    timestamps: true, // createAt - updatedAt
  }
);

const AccountAdmin = mongoose.model("AccountAdmin", schema, "accounts-admin");

export default AccountAdmin;
