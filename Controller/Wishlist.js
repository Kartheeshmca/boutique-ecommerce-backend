import Wishlist from "../Models/Wishlist.js";
import Product from "../Models/Product.js";

// Add to Wishlist
export const addToWishlist = async (req, res) => {
  const userId = req.user.id; // automatically from JWT
  const { product } = req.body; // only need productId

  try {
    // Check if product exists
    const foundProduct = await Product.findById(product);
    if (!foundProduct) return res.status(404).json({ message: "Product not found" });

    // Check if already in wishlist
    const exists = await Wishlist.findOne({ user: userId, product });
    if (exists) return res.status(400).json({ message: "Product already in wishlist" });

    const wishlistItem = new Wishlist({ user: userId, product });
    await wishlistItem.save();

    res.status(201).json({ message: "Product added to wishlist", wishlistItem });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Get all wishlist items of the logged-in user
export const getWishlist = async (req, res) => {
  const userId = req.user.id; // from JWT
  try {
    const wishlist = await Wishlist.find({ user: userId }).populate("product");
    res.status(200).json(wishlist);
  } catch (error) {
    res.status(500).json({ message: "Internal server error" });
  }
};

// Remove a wishlist item (still by wishlist _id)

// Remove a wishlist item
export const removeFromWishlist = async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;

  try {
    const wishlistItem = await Wishlist.findById(id);
    if (!wishlistItem)
      return res.status(404).json({ message: "Wishlist item not found" });

    if (wishlistItem.user.toString() !== userId) {
      return res.status(403).json({ message: "Access denied" });
    }

    await Wishlist.findByIdAndDelete(id);
    res.status(200).json({ message: "Wishlist item removed" });
  } catch (error) {
    console.error("Error removing wishlist item:", error);
    res.status(500).json({ message: "Internal server error", error: error.message });
  }
};








