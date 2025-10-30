import Report from "../Models/Report.js";
import User from "../Models/User.js";
import Admin from "../Models/Admin.js";
import { sendEmail } from "../Utils/sendemail.js";

// Create Report & Notify Admins
export const createReport = async (req, res) => {
  try {
    const { name, email, phone, message, label } = req.body;

    // 1️⃣ Get logged-in user ID from Auth middleware
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized: User not logged in" });
    }

    // 2️⃣ Validate user
    const checkUser = await User.findById(userId);
    if (!checkUser) {
      return res.status(404).json({ message: "User not found" });
    }

    // 3️⃣ Create report
    const report = await Report.create({
      user: userId,
      name,
      email,
      phone,
      message,
      label,
    });

    // 4️⃣ Find admins
    const admins = await Admin.find({ role: { $in: ["super admin", "admin"] } });
    const adminEmails = admins.map(a => a.email);

    if (adminEmails.length > 0) {
      const subject = `New Report Submitted by ${name}`;
      const html = `
        <h2>New Report Notification</h2>
        <p><strong>User:</strong> ${name} (${email})</p>
        <p><strong>Phone:</strong> ${phone || "N/A"}</p>
        <p><strong>Label:</strong> ${label}</p>
        <p><strong>Message:</strong></p>
        <p>${message}</p>
      `;

      try {
        // Send emails to all admins concurrently
        await Promise.all(
          adminEmails.map(adminEmail => sendEmail(adminEmail, subject, message, html))
        );
        console.log("All admin emails sent successfully!");
      } catch (emailErr) {
        console.error("Error sending emails to admins:", emailErr.message);
      }
    }

    res.status(201).json({
      message: "Report created successfully and admin notified",
      report,
    });

  } catch (error) {
    console.error("Error creating report:", error.message);
    res.status(500).json({ message: "Error creating report", error: error.message });
  }
};

// Get all Reports
export const getReports = async (req, res) => {
  try {
    const reports = await Report.find().populate("user", "name email");
    res.status(200).json({ count: reports.length, reports });
  } catch (error) {
    res.status(500).json({ message: "Error fetching reports", error: error.message });
  }
};

// Get single Report by ID
export const getReportById = async (req, res) => {
  try {
    const report = await Report.findById(req.params.id).populate("user", "name email");
    if (!report) {
      return res.status(404).json({ message: "Report not found" });
    }
    res.status(200).json(report);
  } catch (error) {
    res.status(500).json({ message: "Error fetching report", error: error.message });
  }
};

// Delete Report
export const deleteReport = async (req, res) => {
  try {
    const report = await Report.findByIdAndDelete(req.params.id);
    if (!report) {
      return res.status(404).json({ message: "Report not found" });
    }
    res.status(200).json({ message: "Report deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Error deleting report", error: error.message });
  }
};
