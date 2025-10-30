import mongoose from "mongoose";
const offerSchema = new mongoose.Schema(
  {
    couponcode: { 
      type: String, 
      unique: true, 
      required: true, 
      trim: true 
    },
    discount_type: { 
      type: String, 
      enum: ["flat", "percent"], 
      required: true 
    },
    discount_value: { 
      type: Number, 
      required: true, 
      min: 0 
    },
    min_order_amount: { 
      type: Number, 
      default: 0 
    },
    expiry_date: { 
      type: Date, 
      required: true 
    },
    usage_limit: { 
      type: Number, 
      default: 1, 
      min: 1 
    }
  },
  { timestamps: true } 
);

export default mongoose.model("Offer", offerSchema);