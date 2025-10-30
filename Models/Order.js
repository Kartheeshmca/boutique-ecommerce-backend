import mongoose from "mongoose";

const orderSchema = new mongoose.Schema(
  {
    user: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: "User", 
      required: true 
    },
    address: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: "Address", 
      required: true 
    },
    orderItems: [
      { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: "OrderItem", 
        required: true 
      }
    ],
    status: { 
      type: String, 
      enum: ["pending", "confirmed", "shipped", "delivered", "cancelled", "returned", "refunded"], 
      default: "pending" 
    },
    offer: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: "Offer" 
    },
    payment: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: "Payment" 
    },
    total_amount: { type: Number, required: true }, 
    notes: String
  },
  { timestamps: true }
);

export default mongoose.model("Order", orderSchema);
