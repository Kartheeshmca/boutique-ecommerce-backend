import Carousel from "../Models/Carousel.js";

/**
 * ✅ Upload Carousel Images (Admin only)
 * - Upload multiple images to Cloudinary
 * - Store file URLs in DB
 */
export const uploadCarouselImages = async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ message: "No images uploaded" });
    }

    // Cloudinary automatically provides URLs in req.files[].path
    const imageUrls = req.files.map((file) => file.path);

    let carousel = await Carousel.findOne();

    if (!carousel) {
      carousel = new Carousel({ images: imageUrls });
    } else {
      carousel.images.push(...imageUrls);
    }

    await carousel.save();

    return res.status(201).json({
      message: "Images uploaded successfully to Cloudinary",
      data: carousel,
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

/**
 * ✅ Get All Carousel Images (Public)
 */
export const getCarouselImages = async (req, res) => {
  try {
    const carousel = await Carousel.findOne();
    if (!carousel || carousel.images.length === 0) {
      return res.status(404).json({ message: "No images found" });
    }
    res.status(200).json({ data: carousel.images });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * ✅ Delete a Carousel Image (Admin only)
 * - Removes from DB
 * - (Optional) Delete from Cloudinary using public_id
 */
import { v2 as cloudinary } from "cloudinary";
import url from "url";

export const deleteCarouselImage = async (req, res) => {
  try {
    const { imageUrl } = req.body;
    if (!imageUrl) {
      return res.status(400).json({ message: "Image URL is required" });
    }

    const carousel = await Carousel.findOne();
    if (!carousel) {
      return res.status(404).json({ message: "Carousel not found" });
    }

    // Remove from DB
    carousel.images = carousel.images.filter((img) => img !== imageUrl);
    await carousel.save();

    // Extract public_id from Cloudinary URL and delete
    const parsedUrl = url.parse(imageUrl);
    const parts = parsedUrl.pathname.split("/");
    const fileName = parts.pop();
    const publicId = "boutique/carousel/" + fileName.split(".")[0];
    await cloudinary.uploader.destroy(publicId);

    res.status(200).json({ message: "Image deleted successfully", data: carousel });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
