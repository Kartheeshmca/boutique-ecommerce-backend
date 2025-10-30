import jwt from "jsonwebtoken";
import UserSchema from "../Models/User.js";
import adminSchema from "../Models/Admin.js";

// ✅ Auth middleware (check if token is valid)
export const Auth = async (req, res, next) => {
  const token = req.headers.token;

  if (!token) {
    return res.status(401).json({ message: "Authorization token required" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // just store token payload for now
    next();
  } catch (err) {
    return res.status(401).json({ message: "Token invalid or expired" });
  }
};

// ✅ Role-based middleware (works for both User & Admin)
export const authorizeRoles = (...allowedRoles) => {
  return async (req, res, next) => {
    try {
      // First try to find in User collection
      let account = await UserSchema.findById(req.user.id).select("-password");

      // If not found, try in Admin collection
      if (!account) {
        account = await adminSchema.findById(req.user.id).select("-password");
      }

      if (!account) {
        return res.status(404).json({ message: "User/Admin not found" });
      }

      // Check role
      if (!allowedRoles.map(r => r.toLowerCase()).includes(account.role.toLowerCase())) {
        return res.status(403).json({
          message: `Access denied: only [${allowedRoles.join(", ")}] can access`
        });
      }

      req.user = account; // attach full user/admin object
      next();
    } catch (error) {
      return res.status(500).json({ message: error.message });
    }
  };
};
