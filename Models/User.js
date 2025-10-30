import mongoose from "mongoose";
import bcrypt from "bcrypt";

// Capitalize helper
const capitalizeName = (name) => {
  return name
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
};

const userSchema = new mongoose.Schema(
  {
    firstName: {
      type: String,
      required: [true, "First name is required"],
      trim: true,
    },
    lastName: {
      type: String,
      required: [true, "Last name is required"],
      trim: true,
    },
    phone: {
      type: String,
      required: [true, "Phone is required"],
      unique: true,
      match: [/^[0-9]{10}$/, "Phone must be 10 digits"],
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      lowercase: true,
      unique: true,
      match: [/\S+@\S+\.\S+/, "Invalid email"],
    },
    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: [6, "Password must be at least 6 characters"],
      select: false,
    },
    profileImage: {
      type: String,
      default: "",
    },
    profileImagePublicId: {
       type: String,
        default: "",
    },
    role: {
      type: String,
      enum: ["user", "admin", "super admin"],
      default: "user",
    },
    status:{
    type: String,
    enum: ["Active", "Inactive"],
    default: "Active",
  },
    isVerified: {
      type: Boolean,
      default: true,
    },
    resetPasswordToken: String,
    resetPasswordExpire: Date,
  },
  { timestamps: true }
);

// Hooks
userSchema.pre("save", async function (next) {
  if (this.isModified("firstName")) {
    this.firstName = capitalizeName(this.firstName);
  }
  if (this.isModified("lastName")) {
    this.lastName = capitalizeName(this.lastName);
  }

  if (!this.isModified("password")) return next();

  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);

  next();
});

// Compare password
userSchema.methods.comparePassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

export default mongoose.model("User", userSchema);
