import Category from "../Models/Category.js";

// ---------------- Create Category ----------------
export const createCategory = async (req, res) => {
  try {
    const { name, description, status } = req.body;

    if (!name || name.trim() === "") {
      return res.status(400).json({ message: "Category name is required" });
    }

    const existingCategory = await Category.findOne({
      name: { $regex: `^${name.trim()}$`, $options: "i" }
    });

    if (existingCategory) {
      return res.status(400).json({ message: "Category already exists" });
    }

    const category = await Category.create({ name: name.trim(), description, status });
    res.status(201).json({ message: "Category created", category });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ---------------- Get All Categories with Search & Pagination ----------------
export const getAllCategories = async (req, res) => {
  try {
    let { page, limit, search = "", sortBy = "createdAt", order = "desc" } = req.query;

    const query = {};

    // Only active categories for users
    if (req.user.role.toLowerCase() === "user") {
      query.status = "active";
    }

    // Search by name or description
    if (search) {
      const regex = { $regex: search, $options: "i" };
      query.$or = [{ name: regex }, { description: regex }];
    }

    const total = await Category.countDocuments(query);

    let categoriesQuery = Category.find(query).sort({ [sortBy]: order === "desc" ? -1 : 1 });

    // Apply pagination only if limit is provided
    if (limit) {
      page = Number(page) || 1;
      limit = Number(limit);
      const skip = (page - 1) * limit;
      categoriesQuery = categoriesQuery.skip(skip).limit(limit);
    }

    const categories = await categoriesQuery;

    res.json({
      success: true,
      total,
      page: page ? Number(page) : 1,
      pages: limit ? Math.ceil(total / limit) : 1,
      categories
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


// ---------------- Get Category By Id ----------------
export const getCategoryById = async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);
    if (!category) return res.status(404).json({ message: "Category not found" });

    if (req.user.role.toLowerCase() === "user" && category.status !== "active") {
      return res.status(403).json({ message: "Access denied: category is inactive" });
    }

    res.json({ success: true, category });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ---------------- Update Category ----------------
export const updateCategory = async (req, res) => {
  try {
    const { name, description, status } = req.body;

    if (name) {
      const duplicate = await Category.findOne({
        _id: { $ne: req.params.id },
        name: { $regex: `^${name.trim()}$`, $options: "i" }
      });
      if (duplicate) return res.status(400).json({ message: "Category with this name already exists" });
    }

    const category = await Category.findByIdAndUpdate(
      req.params.id,
      { name: name?.trim(), description, status },
      { new: true, runValidators: true }
    );

    if (!category) return res.status(404).json({ message: "Category not found" });
    res.json({ message: "Category updated", category });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ---------------- Delete Category ----------------
export const deleteCategory = async (req, res) => {
  try {
    const category = await Category.findByIdAndDelete(req.params.id);
    if (!category) return res.status(404).json({ message: "Category not found" });
    res.json({ message: "Category deleted" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
