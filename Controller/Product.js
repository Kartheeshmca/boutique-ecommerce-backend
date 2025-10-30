import Category from "../Models/Category.js";
import Product from "../Models/Product.js";
import { v2 as cloudinary } from "cloudinary";

// ------------------- Product Controllers -------------------

// Create Product
export const createProduct = async (req, res) => {
  try {
    const { category, name, description, status, variants } = req.body;

    // Validate category
    const cat = await Category.findById(category);
    if (!cat) return res.status(404).json({ success: false, message: "Category not found" });

    // Check duplicate name
    const existingProduct = await Product.findOne({ name: name.trim() });
    if (existingProduct)
      return res.status(400).json({ success: false, message: "Product name already exists" });

    // Check SKU duplicates
    if (variants && variants.length > 0) {
      for (let v of variants) {
        const existingSku = await Product.findOne({ "variants.sku": v.sku });
        if (existingSku)
          return res.status(400).json({ success: false, message: `SKU ${v.sku} already exists` });
      }
    }

    const product = await Product.create({
      category,
      name,
      description,
      status: ["Available", "Out of Stock", "Discontinued"].includes(status) ? status : "Available",
      variants: variants || [],
      images: [], // no images at creation
    });

    res.status(201).json({ success: true, message: "Product created successfully", data: product });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get All Products
export const getAllProducts = async (req, res) => {
  try {
    let { search, page, limit, sortBy = "createdAt", order = "desc" } = req.query;
    let query = {};

    if (req.user?.role?.toLowerCase() === "user") query.status = "Available";

    if (search) {
      const regex = { $regex: search, $options: "i" };
      query.$or = [
        { name: regex },
        { description: regex },
        { "variants.sku": regex },
        { "variants.color": regex },
        { "variants.size": regex },
      ];
      if (!isNaN(search)) query.$or.push({ "variants.price": Number(search) });
    }

    const sortOrder = order.toLowerCase() === "asc" ? 1 : -1;
    const sortQuery = { [sortBy]: sortOrder };

    let productsQuery = Product.find(query).populate("category", "name").sort(sortQuery).lean();

    // Pagination
    let currentPage = 1;
    let perPage = 0;
    if (limit) {
      currentPage = parseInt(page) || 1;
      perPage = parseInt(limit);
      const skip = (currentPage - 1) * perPage;
      productsQuery = productsQuery.skip(skip).limit(perPage);
    }

    const products = await productsQuery;
    const total = await Product.countDocuments(query);

    if (!products.length) return res.status(404).json({ success: false, message: "No products found" });

    // Map images to URLs only
    const formattedProducts = products.map(p => ({ ...p, images: p.images.map(img => img.url) }));

    res.json({
      success: true,
      total,
      page: limit ? currentPage : 1,
      limit: limit ? perPage : total,
      pages: limit ? Math.ceil(total / perPage) : 1,
      data: formattedProducts,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get Product by ID
export const getProductById = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id).populate("category", "name").lean();
    if (!product) return res.status(404).json({ success: false, message: "Product not found" });

    if (req.user.role.toLowerCase() === "user" && product.status !== "Available") {
      return res.status(403).json({ success: false, message: "Product is not available" });
    }

    res.json({ success: true, data: { ...product, images: product.images.map(img => img.url) } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Upload Product Image
export const uploadProductImage = async (req, res) => {
  try {
    const { productId } = req.body;
    if (!req.file) return res.status(400).json({ message: "No file uploaded" });

    const product = await Product.findById(productId);
    if (!product) return res.status(404).json({ message: "Product not found" });

    product.images.push({ url: req.file.path, public_id: req.file.filename });
    await product.save();

    res.json({ success: true, message: "Image uploaded successfully", data: product });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Delete Product Image
export const deleteProductImage = async (req, res) => {
  try {
    const { productId, public_id } = req.body;
    if (!productId || !public_id) return res.status(400).json({ message: "Product ID & public_id required" });

    const product = await Product.findById(productId);
    if (!product) return res.status(404).json({ message: "Product not found" });

    await cloudinary.uploader.destroy(public_id);
    product.images = product.images.filter(img => img.public_id !== public_id);
    await product.save();

    res.json({ success: true, message: "Image deleted", images: product.images });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Update Product (with optional image upload)
export const updateProduct = async (req, res) => {
  try {
    const { category, name, description, status, variants, removeImages } = req.body;
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ message: "Product not found" });

    if (category) {
      const cat = await Category.findById(category);
      if (!cat) return res.status(404).json({ message: "Category not found" });
      product.category = category;
    }

    if (name) {
      const existingProduct = await Product.findOne({ name: name.trim(), _id: { $ne: req.params.id } });
      if (existingProduct) return res.status(400).json({ message: "Product name exists" });
      product.name = name;
    }

    if (description) product.description = description;
    if (status) product.status = status;

    if (variants) product.variants = variants;

    // Remove images from Cloudinary
    if (removeImages?.length > 0) {
      for (let id of removeImages) {
        await cloudinary.uploader.destroy(id);
        product.images = product.images.filter(img => img.public_id !== id);
      }
    }

    // Add uploaded image
    if (req.file) product.images.push({ url: req.file.path, public_id: req.file.filename });

    await product.save();
    res.json({ success: true, message: "Product updated successfully", data: product });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Delete Product
export const deleteProduct = async (req, res) => {
  try {
    const product = await Product.findByIdAndDelete(req.params.id);
    if (!product) return res.status(404).json({ message: "Product not found" });
    res.json({ success: true, message: "Product deleted" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Stock Management
export const decreaseStock = async (req, res) => {
  try {
    const { productId, variantSku, quantity } = req.body;
    const product = await Product.findById(productId);
    if (!product) return res.status(404).json({ message: "Product not found" });

    const variant = product.variants.find(v => v.sku === variantSku);
    if (!variant) return res.status(404).json({ message: "Variant not found" });

    if (variant.stock < quantity)
      return res.status(400).json({ message: `Only ${variant.stock} items left` });

    variant.stock -= quantity;
    const totalStock = product.variants.reduce((sum, v) => sum + v.stock, 0);
    product.status = totalStock === 0 ? "Out of Stock" : "Available";

    await product.save();
    res.json({ success: true, message: `Stock decreased by ${quantity}`, data: product });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const increaseStock = async (req, res) => {
  try {
    const { productId, variantSku, quantity } = req.body;
    const product = await Product.findById(productId);
    if (!product) return res.status(404).json({ message: "Product not found" });

    const variant = product.variants.find(v => v.sku === variantSku);
    if (!variant) return res.status(404).json({ message: "Variant not found" });

    variant.stock += quantity;
    const totalStock = product.variants.reduce((sum, v) => sum + v.stock, 0);
    product.status = totalStock === 0 ? "Out of Stock" : "Available";

    await product.save();
    res.json({ success: true, message: `Stock increased by ${quantity}`, data: product });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
