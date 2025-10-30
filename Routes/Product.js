import express from "express";
import {
  createProduct,
  getAllProducts,
  getProductById,
  updateProduct,
  deleteProduct,
  decreaseStock,
  increaseStock,
  uploadProductImage,
  deleteProductImage,
} from "../Controller/Product.js";
import { Auth, authorizeRoles } from "../Middleware/Auth.js";
import { upload } from "../Utils/cloud.js";

const router = express.Router();

// Product routes
router.post("/create", Auth, authorizeRoles("admin", "super admin"), createProduct);
router.get("/all", getAllProducts);
router.get("/byId/:id", Auth, authorizeRoles("user", "admin", "super admin"), getProductById);
router.put("/update/:id", Auth, authorizeRoles("admin", "super admin"), updateProduct);
router.delete("/delete/:id", Auth, authorizeRoles("super admin"), deleteProduct);

// Stock management
router.post("/stock/decrease", Auth, authorizeRoles("admin", "super admin"), decreaseStock);
router.post("/stock/increase", Auth, authorizeRoles("admin", "super admin"), increaseStock);

// Image management
router.post("/upload", Auth, authorizeRoles("admin", "super admin"), upload.single("file"), uploadProductImage);
router.post("/delete-image", Auth, authorizeRoles("admin", "super admin"), deleteProductImage);

export default router;
