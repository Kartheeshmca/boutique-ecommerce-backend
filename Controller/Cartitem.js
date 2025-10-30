import CartItem from "../Models/Cartitem.js";
import Product from "../Models/Product.js";
import mongoose from "mongoose";


// Helper function to get cart items + totalAmount
const getCartData = async (userId) => {
  const items = await CartItem.find({ user: userId })
    .populate("product", "name images")
    .populate("variant", "color size price sku");
  const totalAmount = items.reduce((acc, item) => acc + item.subtotal, 0);
  return { items, totalAmount };
};

// Add item to cart
export const addItem = async (req, res) => {
  try {
    const { product, variant, quantity } = req.body;
    const userId = req.user.id;

    if (!product || !variant || !quantity) {
      return res.status(400).json({ success: false, message: "Product, variant, and quantity are required" });
    }

    // Get variant price from Product collection
    const productDoc = await Product.findById(product);
    if (!productDoc) return res.status(404).json({ success: false, message: "Product not found" });

    const variantObj = productDoc.variants.id(variant);
    if (!variantObj) return res.status(404).json({ success: false, message: "Variant not found" });

    const price = variantObj.price;

    // Check if same product + variant exists in cart
    let cartItem = await CartItem.findOne({ user: userId, product, variant });

    if (cartItem) {
      cartItem.quantity += quantity;
      cartItem.subtotal = cartItem.quantity * cartItem.price;
    } else {
      cartItem = new CartItem({
        user: userId,
        product,
        variant,
        quantity,
        price,
        subtotal: quantity * price,
      });
    }

    await cartItem.save();
    const cartData = await getCartData(userId);
    res.status(200).json({ success: true, cart: cartData });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

// Update quantity
export const updateQuantity = async (req, res) => {
  try {
    const { itemId, quantity } = req.body;
    const userId = req.user.id;

    const cartItem = await CartItem.findOne({ _id: itemId, user: userId });
    if (!cartItem) return res.status(404).json({ success: false, message: "Cart item not found" });

    cartItem.quantity = quantity;
    cartItem.subtotal = quantity * cartItem.price;

    await cartItem.save();
    const cartData = await getCartData(userId);
    res.status(200).json({ success: true, cart: cartData });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

// Remove item
export const removeItem = async (req, res) => {
  try {
    const { itemId } = req.params;
    const userId = req.user.id;

    if (!mongoose.Types.ObjectId.isValid(itemId)) {
      return res.status(400).json({ success: false, message: "Invalid cart item ID" });
    }

    const deleted = await CartItem.findOneAndDelete({ _id: itemId, user: userId });
    if (!deleted) return res.status(404).json({ success: false, message: "Cart item not found" });

    const cartData = await getCartData(userId);
    res.status(200).json({ success: true, message: "Item removed", cart: cartData });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

// Get current user's cart
export const getCart = async (req, res) => {
  try {
    const userId = req.user.id;
    const cartData = await getCartData(userId);
    res.status(200).json({ success: true, cart: cartData });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

// Get cart by userId (admin)
export const getUserCart = async (req, res) => {
  try {
    const { userId } = req.params;
    if (req.user.id.toString() !== userId && req.user.role !== "super admin" && req.user.role !== "admin") {
      return res.status(403).json({ success: false, message: "Forbidden" });
    }

    const cartData = await getCartData(userId);
    res.status(200).json({ success: true, cart: cartData });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};
