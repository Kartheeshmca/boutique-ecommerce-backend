import mongoose from "mongoose";

// Variant sub-schema
const variantSchema = new mongoose.Schema({
   color: {
    type: [String],
    enum: ["Red", "Blue", "Green", "Black", "White", "Yellow", "Pink", "Gray","Maroon","Purple" ],
    default: ["Blue", "Black","Maroon","Red"], // ✅ Default color options
    validate: {
      validator: (arr) => Array.isArray(arr) && arr.length > 0,
      message: "At least one color is required",
    },
  },
  size: {
    type: [String],
    enum: ["XS", "S", "M", "L", "XL", "XXL"],
    default: ["S", "M", "L","XL"], // ✅ Default size options
    validate: {
      validator: (arr) => Array.isArray(arr) && arr.length > 0,
      message: "At least one size is required",
    },
  },
  
  sku: {
    type: String,
    required: [true, "SKU is required"],
    uppercase: true,
    trim: true,
    match: [/^[A-Z0-9_-]+$/, "SKU can only contain letters, numbers, underscores, or hyphens"],
  },
  stock: {
    type: Number,
    default: 0,
    min: [0, "Stock cannot be negative"],
    validate: {
      validator: Number.isInteger,
      message: "Stock must be an integer",
    },
  },
  price: {
    type: Number,
    required: [true, "Price is required"],
    min: [0, "Price cannot be negative"],
    max: [1000000, "Price cannot exceed 1,000,000"],
  },
});

// Product schema
const productSchema = new mongoose.Schema(
  {
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      required: [true, "Product must belong to a category"],
    },
    name: {
      type: String,
      required: [true, "Product name is required"],
      trim: true,
      minlength: [3, "Product name must be at least 3 characters"],
      maxlength: [200, "Product name cannot exceed 200 characters"],
    },
    description: {
      type: String,
      trim: true,
      maxlength: [2000, "Description cannot exceed 2000 characters"],
      default: null,
    },
    images: [
      {
        url: {
          type: String,
          trim: true,
          required: true,
          validate: {
            validator: (v) => /^https?:\/\/.*\.(jpeg|jpg|png|webp)$/i.test(v),
            message: "Image must be a valid URL ending with .jpeg, .jpg, .png, or .webp",
          },
        },
        public_id: {
          type: String,
          required: true,
          trim: true,
        },
      },
    ],
    status: {
      type: String,
      enum: ["Available", "Out of Stock", "Discontinued"],
      default: "Available",
    },
    variants: [variantSchema], // Multiple variants
  },
  { timestamps: true }
);

export default mongoose.model("Product", productSchema);
