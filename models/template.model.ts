import mongoose from "mongoose";

const schema = new mongoose.Schema({
  dataTourListOne: String,
  dataTourListTwo: String,
});

const Template = mongoose.model("Template", schema, "templates");

export default Template;
