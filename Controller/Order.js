import Order from "../Models/Order.js";
import OrderItem from "../Models/Orderitem.js";
import Payment from "../Models/Payment.js";
import mongoose from "mongoose";
import { sendEmail } from "../Utils/sendemail.js";

// ✅ Create Order
export const createOrder = async (req, res) => {
  try {
    const { user, address, total_amount, notes } = req.body;

    if (!user || !address || !total_amount) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    const order = await Order.create({ user, address, total_amount, notes });
    res.status(201).json({
      success: true,
      message: "Order created successfully. Use payment API to complete payment.",
      order,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ✅ Get Order by ID
export const getOrderById = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate("user", "name email role")
      .populate("address")
      .populate({ path: "orderItems", populate: { path: "product", select: "name price" } })
      .populate("offer")
      .populate("payment");

    if (!order) return res.status(404).json({ message: "Order not found" });

    // ✅ Use req.user.id instead of req.user._id
    if (!req.user || !req.user.id)
      return res.status(401).json({ message: "Authorization required" });

    if (req.user.role === "user") {
      if (!order.user || !order.user._id)
        return res.status(400).json({ message: "Order has no user assigned" });

      if (order.user._id.toString() !== req.user.id.toString())
        return res.status(403).json({ message: "Access denied" });
    }

    res.json({ success: true, order });
  } catch (error) {
    console.error("Get Order By ID Error:", error.message);
    res.status(500).json({ message: error.message });
  }
};


// ✅ Update Order (Admin)
export const updateOrder = async (req, res) => {
  try {
    if (!req.user || req.user.role !== "admin") return res.status(403).json({ message: "Admin access required" });

    const order = await Order.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!order) return res.status(404).json({ message: "Order not found" });

    res.json({ success: true, message: "Order updated", order });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ✅ Delete Order (Admin)
export const deleteOrder = async (req, res) => {
  try {
    if (!req.user || req.user.role !== "admin") return res.status(403).json({ message: "Admin access required" });

    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ message: "Order not found" });

    await OrderItem.deleteMany({ order: order._id });
    if (order.payment) await Payment.findByIdAndUpdate(order.payment, { status: "cancelled" });

    order.status = "cancelled";
    await order.save();
    await Order.findByIdAndDelete(order._id);

    res.json({ success: true, message: "Order and related items deleted" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ✅ Get All Orders
export const getAllOrders = async (req, res) => {
  try {
    const { page, limit, search, status, paymentStatus, startDate, endDate } = req.query;

    // ✅ Check authorization
    if (!req.user || !req.user.id)
      return res.status(401).json({ message: "Authorization required" });

    // ✅ Build query
    let query = {};

    if (search) {
      query.$or = [];
      if (mongoose.Types.ObjectId.isValid(search)) query.$or.push({ _id: search });
      if (mongoose.Types.ObjectId.isValid(search)) query.$or.push({ user: search });
      query.$or.push({ "user.name": { $regex: search, $options: "i" } });
      query.$or.push({ "user.email": { $regex: search, $options: "i" } });
    }

    if (status) query.status = status;

    // ✅ Restrict users to their own orders
    if (req.user.role === "user") query.user = req.user.id;

    if (startDate || endDate) query.createdAt = {};
    if (startDate) query.createdAt.$gte = new Date(startDate);
    if (endDate) query.createdAt.$lte = new Date(endDate);

    // ✅ Pagination
    const currentPage = parseInt(page) || 1;
    const perPage = parseInt(limit) || 0; // 0 means no limit, return all

    let ordersQuery = Order.find(query)
      .populate("user", "name email")
      .populate("address")
      .populate({ path: "orderItems", populate: { path: "product" } })
      .populate("offer")
      .populate("payment")
      .sort({ createdAt: -1 });

    if (perPage > 0) {
      ordersQuery = ordersQuery.skip((currentPage - 1) * perPage).limit(perPage);
    }

    let orders = await ordersQuery;

    if (paymentStatus) {
      orders = orders.filter(o => o.payment?.status === paymentStatus);
    }

    const total = await Order.countDocuments(query);

    res.json({
      success: true,
      page: currentPage,
      limit: perPage > 0 ? perPage : total,
      total,
      totalPages: perPage > 0 ? Math.ceil(total / perPage) : 1,
      orders
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


// ✅ Confirm Payment
export const confirmOrderPayment = async (orderId) => {
  try {
    const order = await Order.findById(orderId).populate("user", "name email");
    if (!order) return { success: false, message: "Order not found" };

    order.status = "confirmed";
    await order.save();

    if (order.user?.email) {
      await sendEmail(order.user.email, `Order #${order._id} Confirmed`, `Hi ${order.user.name}, your payment has been received. Order ID: ${order._id}, Total: ₹${order.total_amount}`);
    }

    return { success: true, message: "Order confirmed and email sent", order };
  } catch (error) {
    console.error("Confirm Order Error:", error.message);
    return { success: false, message: error.message };
  }
};

// ✅ Refund Payment
export const refundOrderPayment = async (orderId, amount) => {
  try {
    const order = await Order.findById(orderId).populate("user", "name email");
    if (!order) return { success: false, message: "Order not found" };

    order.status = "refunded";
    await order.save();

    if (order.user?.email) {
      await sendEmail(order.user.email, `Order #${order._id} Refunded`, `Hi ${order.user.name}, your payment for Order ID ${order._id} has been refunded. Amount: ₹${amount}`);
    }

    return { success: true, message: "Order refunded and email sent", order };
  } catch (error) {
    console.error("Refund Order Error:", error.message);
    return { success: false, message: error.message };
  }
};
