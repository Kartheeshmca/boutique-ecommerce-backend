import mongoose from "mongoose";

const cartItemSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true, // each cart item belongs to a user
    },
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },
    variant: { 
      type: mongoose.Schema.Types.ObjectId, 
      required: true 
    },
    quantity: {
      type: Number,
      required: true,
      min: 1,
      default: 1,
    },
    price: {
      type: Number,
      required: true, // snapshot of price at time of adding
    },
    subtotal: {
      type: Number,
      required: true,
    },
  },
  { timestamps: true }
);

// Pre-save middleware to calculate subtotal automatically
cartItemSchema.pre("save", function (next) {
  this.subtotal = this.quantity * this.price;
  next();
});

export default mongoose.model("CartItem", cartItemSchema);
