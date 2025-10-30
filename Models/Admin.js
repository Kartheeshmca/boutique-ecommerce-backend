import mongoose from "mongoose";

const adminSchema = new mongoose.Schema(
  {
    name: { 
        type: String, 
        required: true 
    },
    email: { 
        type: String,
        required: true, 
        unique: true, 
        lowercase: true,
        trim: true, // 👈 ensures clean email input
        match: [/\S+@\S+\.\S+/, "Please enter a valid email address"],
     },
    password: { 
        type: String,
        required: true
     },
    role: { 
        type: String, 
        enum: ["super admin", "admin"], 
        default: "admin" },

    status:{
    type: String,
    enum: ["Active", "Inactive"],
    default: "Active",
  },
  },
  
  { timestamps: true, versionKey: false }
);

export default mongoose.model("Admin", adminSchema);
