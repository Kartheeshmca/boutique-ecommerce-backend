import Review from "../Models/Review.js";
import Product from "../Models/Product.js";

// Create Review
export const createReview = async (req, res) => {
  try {
    const { product, user, rating, comment } = req.body;

    const variant = await Product.findById(product);
    if (!variant) {
      return res.status(404).json({ message: "Product Variant not found" });
    }

    const review = await Review.create({
      product,
      user,
      rating,
      comment,
    });

    res.status(201).json({ message: "Review added", review });
  } catch (error) {
    res.status(500).json({ message: "Error creating review", error: error.message });
  }
};

// Get Reviews for a Product Variant
export const getReviewsByVariant = async (req, res) => {
  try {
    const { id } = req.params;

    const reviews = await Review.find({ product: id })
      .populate("user", "name email") // populate user info
      .populate("product", "name price");

    res.status(200).json({ count: reviews.length, reviews });
  } catch (error) {
    res.status(500).json({ message: "Error fetching reviews", error: error.message });
  }
};

// Delete Review
export const deleteReview = async (req, res) => {
  try {
    const { id } = req.params;

    const review = await Review.findByIdAndDelete(id);
    if (!review) {
      return res.status(404).json({ message: "Review not found" });
    }

    res.status(200).json({ message: "Review deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Error deleting review", error: error.message });
  }
};
