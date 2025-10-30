import mongoose from "mongoose";

const orderItemSchema = new mongoose.Schema(
  {
    order: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: "Order",      // Links to parent order
      required: true 
    },
    product: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: "Product", 
      required: true 
    },
    quantity: { 
      type: Number, 
      required: true, 
      min: 1 
    },
    price: { 
      type: Number, 
      required: true,
      min: 0           // Always good to enforce non-negative price
    }
  },
  { timestamps: true }
);

export default mongoose.model("OrderItem", orderItemSchema);
