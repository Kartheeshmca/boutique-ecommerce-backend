import express from "express";
import { createReview, getReviewsByVariant, deleteReview } from "../Controller/Review.js";

const router = express.Router();

// POST → Add review
router.post("/create", createReview);

// GET → Get reviews for a product variant
router.get("/product/:id", getReviewsByVariant);

// DELETE → Delete review by ID
router.delete("/delete/:id", deleteReview);

export default router;
