import express from "express";
import {
  createSuperAdmin,
  createAdmin,
  getAdmins,
  getAdminById,
  updateAdmin,
  deleteAdmin,
  loginAdmin

} from "../Controller/Admin.js";
import { Auth, authorizeRoles } from "../Middleware/Auth.js";

const router = express.Router();

// One-time super admin creation (no auth required)
router.post("/create-superadmin", createSuperAdmin);

// Super admin routes
router.post("/login", loginAdmin);
router.post("/create", Auth, authorizeRoles("super admin"), createAdmin);
router.get("/all", Auth, authorizeRoles("super admin"), getAdmins);
router.get("/byId/:id", Auth, authorizeRoles("super admin", "admin"), getAdminById);
router.put("/update/:id", Auth, authorizeRoles("super admin"), updateAdmin);
router.delete("/delete/:id", Auth, authorizeRoles("super admin"), deleteAdmin);

export default router;

