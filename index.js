import express from 'express';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import cors from 'cors';
import path from "path";

const app = express();

import userRoutes from './Routes/User.js';
import adminRoutes from './Routes/Admin.js';  
import addressRoutes from './Routes/Address.js';
import cartRoutes from './Routes/Cartitem.js';
import categoryRoutes from './Routes/Category.js';
import productRoutes from './Routes/Product.js';
import wishListRoutes from './Routes/Wishlist.js';
import reviewRoutes from "./Routes/Review.js";
import reportRoutes from "./Routes/Report.js";
import orderItemRoutes from "./Routes/Orderitem.js";
import offerRoutes from "./Routes/Offer.js";
import orderRoutes from "./Routes/Order.js";
import paymentRoutes from "./Routes/Payment.js";
import notificationRoutes from "./Routes/Notification.js";
import carouselRoutes from "./Routes/Carousel.js";


dotenv.config();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());  


mongoose.set("strictQuery", false);
mongoose.connect("mongodb+srv://kartheeshwaran:kartheeshwaran@cluster0.toj6q.mongodb.net/boutique")
  .then(() => console.log("You! Connected to MongoDB..."))
  .catch((err) =>
    console.error("Could not connect to MongoDB... " + err.message)
  );

//  mongoose.connect('mongodb+srv://flaremindstech:flareminds%401308@cluster0.12wutsc.mongodb.net/Billingnew?retryWrites=true&w=majority&appName=Cluster0')
// .then(() => console.log('Connected to MongoDB Atlas...'))
// .catch(err => console.error('Could not connect to MongoDB...'));

// Routes
// app.use('/api/users', userRoutes);


app.get("/", (req, res) => {
  res.send("welcome to Billing Software Server"); 
});

app.use("/api/users", userRoutes);
app.use("/api/admins", adminRoutes);
app.use("/api/addresses", addressRoutes);
app.use("/api/cart", cartRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/products", productRoutes);
app.use("/api/wishlist", wishListRoutes);
app.use("/api/reviews", reviewRoutes);
app.use("/api/reports", reportRoutes);
app.use("/api/order-items", orderItemRoutes);
app.use("/api/offers", offerRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/carousel", carouselRoutes);


// Make uploads folder public
app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));



const PORT = process.env.PORT || 7000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
