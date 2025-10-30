import Payment from "../Models/Payment.js";
import Order from "../Models/Order.js";
import razorpayInstance from "../Utils/razorpay.js"; // Razorpay SDK instance
import crypto from "crypto";
import { confirmOrderPayment, refundOrderPayment } from "./Order.js";

// ✅ Create Razorpay Payment (linked to Order)




// ✅ Create Razorpay Payment (linked to Order)
export const createPayment = async (req, res) => {
  try {
    const { orderId, method = "UPI" } = req.body;

    // 1️⃣ Fetch the order
    const order = await Order.findById(orderId).populate("payment");
    if (!order) return res.status(404).json({ message: "Order not found" });

    // 2️⃣ Prevent duplicate successful payment
    if (order.payment?.status === "paid") {
      return res.status(400).json({ message: "Payment already completed for this order." });
    }

    // 3️⃣ If previous payment failed or is pending, allow retry
    if (order.payment && (order.payment.status === "failed" || order.payment.status === "created")) {
      // Optionally, delete previous failed payment
      await Payment.findByIdAndDelete(order.payment._id);
    }

    // 4️⃣ Create Razorpay order
    const razorpayOrder = await razorpayInstance.orders.create({
      amount: order.total_amount * 100, // amount in paise
      currency: "INR",
      receipt: `order_rcpt_${order._id}`,
      payment_capture: 1,
    });

    // 5️⃣ Save new payment in DB
    const payment = await Payment.create({
      order: order._id,
      amount: order.total_amount,
      currency: "INR",
      method,
      status: "created",
      razorpayOrderId: razorpayOrder.id,
    });

    // 6️⃣ Link payment to order
    order.payment = payment._id;
    await order.save();

    res.status(201).json({
      message: "Payment created. Complete payment to confirm order.",
      payment,
      razorpayOrder,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


// ✅ Verify Razorpay Payment
export const verifyRazorpayPayment = async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

    // Verify signature
    const generatedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest("hex");

    if (generatedSignature !== razorpay_signature)
      return res.status(400).json({ message: "Invalid payment signature" });

    // Update Payment status
    const payment = await Payment.findOneAndUpdate(
      { razorpayOrderId: razorpay_order_id },
      { status: "paid", razorpayPaymentId: razorpay_payment_id },
      { new: true }
    ).populate("order");

    if (!payment) return res.status(404).json({ message: "Payment not found" });

    // ✅ Confirm order payment and send email
    if (payment.order) {
      const confirmationResult = await confirmOrderPayment(payment.order._id);
      if (!confirmationResult.success) {
        return res.status(500).json({ message: confirmationResult.message });
      }
    }

    res.json({ message: "Payment verified and order confirmed", payment });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ✅ Refund Payment
export const refundPayment = async (req, res) => {
  try {
    const { paymentId, amount } = req.body;

    const refund = await razorpayInstance.payments.refund(paymentId, { amount: amount * 100 });

    const payment = await Payment.findOne({ razorpayPaymentId: paymentId }).populate("order");
    if (!payment) return res.status(404).json({ message: "Payment not found" });

    payment.status = "refunded";
    await payment.save();

    // ✅ Update order status and send email
    if (payment.order) {
      await refundOrderPayment(payment.order._id, amount);
    }

    res.json({ message: "Refund processed and email sent", refund });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ✅ Razorpay Webhook
// ✅ Razorpay Webhook
export const razorpayWebhook = async (req, res) => {
  try {
    const secret = process.env.RAZORPAY_WEBHOOK_SECRET;

    // Convert raw body buffer to string
    const body = req.body.toString();

    // Verify signature
    const shasum = crypto.createHmac("sha256", secret);
    shasum.update(body);
    const digest = shasum.digest("hex");

    if (digest !== req.headers["x-razorpay-signature"]) {
      return res.status(400).json({ message: "Invalid webhook signature" });
    }

    const webhookData = JSON.parse(body);
    const { event, payload } = webhookData;

    // Get payment entity
    const entity = payload.payment.entity;
    const payment = await Payment.findOne({ razorpayPaymentId: entity.id }).populate("order");

    if (!payment) return res.status(404).json({ message: "Payment not found" });

    // ✅ Handle events
    if (event === "payment.captured") {
      payment.status = "paid";
      await payment.save();

      if (payment.order) {
        payment.order.status = "confirmed";
        await payment.order.save();

        if (payment.order.user?.email) {
          await sendEmail(
            payment.order.user.email,
            `Order #${payment.order._id} Confirmed`,
            `Hi ${payment.order.user.name}, your payment of ₹${payment.amount} has been received. Order is confirmed.`
          );
        }
      }
    } else if (event === "payment.failed") {
      payment.status = "failed";
      await payment.save();

      if (payment.order) {
        payment.order.status = "pending"; // or "payment_failed"
        await payment.order.save();

        if (payment.order.user?.email) {
          await sendEmail(
            payment.order.user.email,
            `Payment Failed for Order #${payment.order._id}`,
            `Hi ${payment.order.user.name}, your payment of ₹${payment.amount} failed. Please try again.`
          );
        }
      }
    } else if (event === "payment.refunded") {
      payment.status = "refunded";
      await payment.save();

      if (payment.order) {
        payment.order.status = "refunded";
        await payment.order.save();

        if (payment.order.user?.email) {
          await sendEmail(
            payment.order.user.email,
            `Order #${payment.order._id} Refunded`,
            `Hi ${payment.order.user.name}, your payment of ₹${payment.amount} has been refunded.`
          );
        }
      }
    }

    res.json({ received: true });
  } catch (error) {
    console.error("Webhook Error:", error.message);
    res.status(500).json({ message: error.message });
  }
};

// ✅ Get Payment by ID
export const getPaymentById = async (req, res) => {
  try {
    const payment = await Payment.findById(req.params.id).populate("order");
    if (!payment) return res.status(404).json({ message: "Payment not found" });
    res.json(payment);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ✅ Get All Payments (pagination + filters)
export const getAllPayments = async (req, res) => {
  try {
    const { page = 1, limit = 10, status } = req.query;
    const query = status ? { status } : {};

    const payments = await Payment.find(query)
      .populate("order")
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const total = await Payment.countDocuments(query);

    res.json({
      success: true,
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      totalPages: Math.ceil(total / limit),
      payments,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
