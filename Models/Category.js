import mongoose from "mongoose";

const categorySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true, 
      trim: true,
      minlength: 3, 
      maxlength: 50,
    },
    description: {
      type: String,
      trim: true,
      maxlength:200,
      default: null,
    },
    status: {
      type: String,
      enum: {
        values: ["active", "inactive"],
      },
      default: "active",
    },
  },
  { timestamps: true }
);

export default mongoose.model("Category", categorySchema);
