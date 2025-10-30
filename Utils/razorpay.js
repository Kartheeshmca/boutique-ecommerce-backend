import Razorpay from "razorpay";
import dotenv from "dotenv";

dotenv.config(); // ensure env is loaded

if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
  throw new Error(
    "Razorpay keys are missing! Check your .env file for RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET"
  );
}

const razorpayInstance = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

export default razorpayInstance;
