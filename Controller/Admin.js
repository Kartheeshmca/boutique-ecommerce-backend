import Admin from "../Models/Admin.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
// Password & email regex
const passwordRegex = /^(?=.*[A-Z])(?=.*[a-z])(?=.*\d).{8,}$/;
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// JWT Token generator
const generateToken = (id, role) => {
  return jwt.sign({ id, role }, process.env.JWT_SECRET, { expiresIn: "2d" });
};

// ---------------- Admin Login ----------------
export const loginAdmin = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required" });
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ message: "Invalid email format" });
    }

    // Password validation
    const passwordRegex = /^(?=.*[A-Z])(?=.*[a-z])(?=.*\d).{8,}$/;
    if (!passwordRegex.test(password)) {
      return res.status(400).json({
        message:
          "Password must be at least 8 characters long, contain uppercase, lowercase, and a number",
      });
    }

    // Find admin by email
    const admin = await Admin.findOne({ email }).select("+password");
    if (!admin) return res.status(400).json({ message: "Invalid email or password" });

    // Compare password
    const isMatch = await bcrypt.compare(password, admin.password);
    if (!isMatch) return res.status(400).json({ message: "Invalid email or password" });
    
    if (admin.status === "Inactive") {
       return res.status(403).json({ message: "Your account is inactive. Please contact Super Admin." });
    }

    // Generate token
    const token = generateToken(admin._id, admin.role);

    res.json({
      token,
      id: admin._id,
      role: admin.role,
      name: admin.name,
      email: admin.email,
      status: admin.status,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ---------------- Create Super Admin (one-time) ----------------
export const createSuperAdmin = async (req, res) => {
  try {
    
    const { name, email, password } = req.body;
    if (!name || !email || !password)
      return res.status(400).json({ message: "Name, email, and password are required" });
    const existing = await Admin.findOne({email});
    if (existing) return res.status(400).json({ message: "Super Admin already exists" });

    if (!emailRegex.test(email))
      return res.status(400).json({ message: "Invalid email format" });

    if (!passwordRegex.test(password))
      return res.status(400).json({
        message:
          "Password must be at least 8 characters long, contain uppercase, lowercase, and a number",
      });

    const hashedPassword = await bcrypt.hash(password, 10);

    const superAdmin = await Admin.create({
      name: name.trim(),
      email: email.trim().toLowerCase(),
      password: hashedPassword,
      role: "super admin",
    });

    res.status(201).json({
      message: "Super Admin created successfully",
      admin: { id: superAdmin._id, name: superAdmin.name, email: superAdmin.email, role: superAdmin.role },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ---------------- Create Admin (Super Admin only) ----------------
export const createAdmin = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    if (!name || !email || !password)
      return res.status(400).json({ message: "Name, email, and password are required" });

    if (!emailRegex.test(email))
      return res.status(400).json({ message: "Invalid email format" });

    if (!passwordRegex.test(password))
      return res.status(400).json({
        message:
          "Password must be at least 8 characters long, contain uppercase, lowercase, and a number",
      });

    const existingAdmin = await Admin.findOne({ email });
    if (existingAdmin) return res.status(400).json({ message: "Email already registered" });

    const hashedPassword = await bcrypt.hash(password, 10);

    const newAdmin = await Admin.create({
      name: name.trim(),
      email: email.trim().toLowerCase(),
      password: hashedPassword,
      role: role || "admin",
    });

    res.status(201).json({
      message: "Admin created successfully",
      admin: { id: newAdmin._id, name: newAdmin.name, email: newAdmin.email, role: newAdmin.role },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ---------------- Get All Admins (with Pagination + Search) ----------------
// ---------------- Get All Admins (Exclude Super Admin) ----------------
export const getAdmins = async (req, res) => {
  try {
    let { page, limit, search = "", status } = req.query;

    // Only find users with role 'admin' (not super admin)
    const query = {
      role: "admin",
      $or: [
        { name: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
      ],
    };
    if (status && ["Active", "Inactive"].includes(status)) {
      query.status = status;
    }

    const total = await Admin.countDocuments(query);

    // If limit is not provided, return all admins
    if (!limit) {
      const admins = await Admin.find(query).select("-password");
      return res.status(200).json({
        total,
        admins,
      });
    }

    // If limit is provided, do pagination
    page = parseInt(page) || 1;
    limit = parseInt(limit) || 10;

    const admins = await Admin.find(query)
      .select("-password")
      .skip((page - 1) * limit)
      .limit(limit);

    res.status(200).json({
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
      admins,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};



// ---------------- Get Admin by ID ----------------
export const getAdminById = async (req, res) => {
  try {
    const admin = await Admin.findById(req.params.id).select("-password");
    if (!admin) return res.status(404).json({ message: "Admin not found" });
    res.status(200).json(admin);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ---------------- Update Admin (Super Admin only) ----------------
// ---------------- Update Admin (Super Admin + Admin) ----------------
export const updateAdmin = async (req, res) => {
  try {
    const { name, email, password, role, status } = req.body;

    const admin = await Admin.findById(req.params.id);
    if (!admin) return res.status(404).json({ message: "Admin not found" });

    // Update name
    if (name) admin.name = name.trim();

    // Update email with validation
    if (email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email))
        return res.status(400).json({ message: "Invalid email format" });
      admin.email = email.trim().toLowerCase();
    }

    // Update password with validation
    if (password) {
      const passwordRegex = /^(?=.*[A-Z])(?=.*[a-z])(?=.*\d).{8,}$/;
      if (!passwordRegex.test(password))
        return res.status(400).json({
          message:
            "Password must be at least 8 characters long, contain uppercase, lowercase, and a number",
        });
      admin.password = await bcrypt.hash(password, 10);
    }

    // Update role (allow changing Super Admin role if needed)
    if (role && ["admin", "super admin"].includes(role.toLowerCase())) {
      admin.role = role.toLowerCase();
    }

    // Update status
    if (status && ["Active", "Inactive"].includes(status)) {
      admin.status = status;
    }

    await admin.save();
    res.status(200).json({
      message: "Admin updated successfully",
      admin: {
        id: admin._id,
        name: admin.name,
        email: admin.email,
        role: admin.role,
        status: admin.status,
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ---------------- Delete Admin (Super Admin only) ----------------
// ---------------- Delete Admin (Super Admin only) ----------------
export const deleteAdmin = async (req, res) => {
  try {
    if (req.user.id === req.params.id) {
      return res.status(400).json({ message: "You cannot delete yourself" });
    }

    const admin = await Admin.findById(req.params.id);
    if (!admin) return res.status(404).json({ message: "Admin not found" });

    // Instead of deleting, mark as inactive
    admin.status = "Inactive";
    await admin.save();

    res.status(200).json({ message: "Admin marked as Inactive successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

