import mongoose from "mongoose";

const schema = new mongoose.Schema(
  {
    userId: String,
    refreshToken: String,
    expiresAt: {
      type: Date,
      expires: 0,
    },
  },
  {
    timestamps: true, // createAt - updatedAt
  }
);

const Session = mongoose.model("Session", schema, "sessions");

export default Session;
