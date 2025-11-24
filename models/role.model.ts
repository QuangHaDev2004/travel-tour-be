import mongoose from "mongoose";

const schema = new mongoose.Schema(
  {
    name: String,
    description: String,
    permissions: [String],
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
    timestamps: true,
  }
);

const Role = mongoose.model("Role", schema, "roles");

export default Role;
