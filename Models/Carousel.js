import mongoose from "mongoose";
const carouselSchema = new mongoose.Schema(
  {
    images: [
    {
        type: String,
        trim: true,
        validate: {
          validator: (v) =>
            /^https?:\/\/.*\.(jpeg|jpg|png|webp)$/i.test(v),
          message:
            "Image must be a valid URL and end with .jpeg, .jpg, .png, or .webp",
        },
      },
    ],
  },
  { timestamps: true }
);

// Since it's a single carousel, we can use a singleton pattern or just find one document
// For simplicity, we'll assume there's only one carousel document

export default mongoose.model("Carousel", carouselSchema);
