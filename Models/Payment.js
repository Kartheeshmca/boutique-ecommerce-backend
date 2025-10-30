import mongoose from "mongoose";
import crypto from "crypto";

const paymentSchema = new mongoose.Schema(
  {
    order: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Order",
      required: true
    },
    amount: {
      type: Number,
      required: true,
      min: 0 // store in paise
    },
    currency: {
      type: String,
      default: "INR",
      uppercase: true
    },
    method: {
      type: String,
      enum: ["UPI", "Card", "Wallet", "NetBanking", "Cash"],
      default: "UPI"
    },
    status: {
      type: String,
      enum: ["created", "paid", "failed", "refunded"],
      default: "created"
    },
    // Razorpay-specific fields
    razorpayOrderId: String,
    razorpayPaymentId: String,
    razorpaySignature: String,
    notes: mongoose.Schema.Types.Mixed
  },
  { timestamps: true, versionKey: false }
);

// Verify Razorpay signature
paymentSchema.methods.verifyRazorpaySignature = function(
  razorpayOrderId,
  razorpayPaymentId,
  razorpaySignature,
  keySecret
) {
  const hmac = crypto.createHmac("sha256", keySecret);
  hmac.update(`${razorpayOrderId}|${razorpayPaymentId}`);
  const generatedSignature = hmac.digest("hex");
  return generatedSignature === razorpaySignature;
};

export default mongoose.model("Payment", paymentSchema);
