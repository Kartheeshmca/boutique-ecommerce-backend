import express from "express";
import {
  createReport,
  getReports,
  getReportById,
  deleteReport,
} from "../Controller/Report.js";
import { Auth, authorizeRoles } from "../Middleware/Auth.js";

const router = express.Router();

// POST → Create a new report (Authenticated users only)
router.post("/create", Auth, createReport);

// GET → Get all reports (Admin only)
router.get("/all", Auth, authorizeRoles("super admin", "admin"), getReports);

// GET → Get single report by ID (Admin only)
router.get("/byId/:id", Auth, authorizeRoles("super admin", "admin"), getReportById);

// DELETE → Delete a report by ID (Admin only)
router.delete("/delete/:id", Auth, authorizeRoles("super admin", "admin"), deleteReport);

export default router;
