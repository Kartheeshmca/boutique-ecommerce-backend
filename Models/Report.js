import mongoose from "mongoose";

const reportSchema = new mongoose.Schema(
  {
    user: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: "User", 
      required: true 
    },
    name: { 
      type: String, 
      required: true, 
      trim: true, 
      maxlength: 100 
    },
    email: { 
      type: String, 
      required: true, 
      trim: true, 
      
      lowercase: true, 
      match: [/^\S+@\S+\.\S+$/, "Please enter a valid email address"] 
    },
    phone: { 
      type: String, 
      trim: true, 
      match: [/^[0-9]{10}$/, "Phone number must be 10 digits"] 
    },
    message: { 
      type: String, 
      required: true, 
      trim: true, 
      maxlength: 1000 
    },
    label: { 
      type: String, 
      enum: ["work", "other"], 
      default: "other" 
    }
  },
  { timestamps: true }
);

export default mongoose.model("Report", reportSchema);
