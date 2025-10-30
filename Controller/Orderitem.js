import OrderItem from "../Models/Orderitem.js";

// ✅ Create Order Item
export const createOrderItem = async (req, res) => {
  try {
    const { order, product, quantity, price } = req.body;
    if (!order || !product || !quantity || !price) return res.status(400).json({ message: "Missing required fields" });

    const newOrderItem = await OrderItem.create({ order, product, quantity, price });
    res.status(201).json({ success: true, data: newOrderItem });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ✅ Get All Order Items
export const getAllOrderItems = async (req, res) => {
  try {
    let { page, limit, search = "", sortBy = "createdAt", order = "desc" } = req.query;

    let orderItemsQuery = OrderItem.find()
      .populate({ path: "product", select: "name price", match: search ? { name: { $regex: search, $options: "i" } } : {} })
      .populate("order", "status total_amount")
      .sort({ [sortBy]: order === "desc" ? -1 : 1 });

    let currentPage = 1, perPage = 0;
    if (limit) {
      currentPage = parseInt(page) || 1;
      perPage = parseInt(limit);
      orderItemsQuery = orderItemsQuery.skip((currentPage - 1) * perPage).limit(perPage);
    }

    let orderItems = await orderItemsQuery;
    orderItems = orderItems.filter(item => item.product);

    const total = await OrderItem.countDocuments();
    res.json({ success: true, total, page: limit ? currentPage : 1, limit: limit ? perPage : total, data: orderItems });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ✅ Get Order Item by ID
export const getOrderItemById = async (req, res) => {
  try {
    const orderItem = await OrderItem.findById(req.params.id)
      .populate("order", "status total_amount")
      .populate("product", "name price");

    if (!orderItem) return res.status(404).json({ message: "Order Item not found" });
    res.json({ success: true, data: orderItem });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ✅ Update Order Item
export const updateOrderItem = async (req, res) => {
  try {
    const updatedOrderItem = await OrderItem.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!updatedOrderItem) return res.status(404).json({ message: "Order Item not found" });
    res.json({ success: true, data: updatedOrderItem });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ✅ Delete Order Item
export const deleteOrderItem = async (req, res) => {
  try {
    const deleted = await OrderItem.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ message: "Order Item not found" });
    res.json({ success: true, message: "Order Item deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
