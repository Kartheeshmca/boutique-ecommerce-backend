import express from "express";
import {
  createOffer,
  getAllOffers,
  getOfferById,
  updateOffer,
  deleteOffer
} from "../Controller/Offer.js";

const router = express.Router();

router.post("/create", createOffer);       // Create Offer
router.get("/all", getAllOffers);       // Get all Offers
router.get("/Id/:id", getOfferById);    // Get one Offer
router.put("/update/:id", updateOffer);     // Update Offer
router.delete("/delete/:id", deleteOffer);  // Delete Offer

export default router;
