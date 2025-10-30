import express from "express";
import { upload } from "../Utils/cloud.js";
import { Auth, authorizeRoles } from "../Middleware/Auth.js";
import {
  uploadCarouselImages,
  getCarouselImages,
  deleteCarouselImage,
} from "../Controller/Carousel.js";

const router = express.Router();

// ✅ Admin uploads carousel images
router.post(
  "/upload",
  Auth,
  authorizeRoles("super admin","admin"),
  upload.array("images", 50),
  uploadCarouselImages
);

// ✅ Public fetch
router.get("/all", getCarouselImages);

// ✅ Admin deletes image
router.delete(
  "/delete",
  Auth,
  authorizeRoles("super admin","admin"),
  deleteCarouselImage
);

export default router;
