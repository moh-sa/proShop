import asyncHandler from "express-async-handler";
import Product from "../models/productModel";
import { IUser } from "../models/userModel";

/**
 * @description Fetch all products
 * @route GET /api/products
 * @access public
 */
const getProducts = asyncHandler(async (req, res) => {
  const pageSize = 10;
  const page = Number(req.query.pageNumber) || 1;

  const keyword = req.query.keyword;
  const query = keyword ? { name: { $regex: keyword, $options: "i" } } : {};

  const count = await Product.countDocuments({ ...query });
  const products = await Product.find({ ...query })
    .limit(pageSize)
    .skip(pageSize * (page - 1));
  res.json({ products, page, pages: Math.ceil(count / pageSize) });
});

/**
 * @description Fetch a single product
 * @route GET /api/products/:id
 * @access public
 */
const getProductById = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);
  if (product) {
    res.json(product);
  } else {
    res.status(404);
    throw new Error("Product not found");
  }
});

/**
 * @description Delete a product
 * @route DELETE /api/products/:id
 * @access private/admin
 */
const deleteProduct = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);
  if (product) {
    await product.remove();
    res.json({ message: "Product removed" });
  } else {
    res.status(404);
    throw new Error("Product not found");
  }
});

/**
 * @description Create a product
 * @route POST /api/products
 * @access private/admin
 */
const createProduct = asyncHandler(async (req, res) => {
  const reqWithUser = req as typeof req & { user: IUser };
  const product = new Product({
    user: reqWithUser.user._id,
    name: "Sample Name",
    image: "/images/sample.png",
    brand: "sample brand",
    category: "sample category",
    description: "sample description",
    numReviews: 0,
    price: 0,
    countInStock: 0,
  });

  const createdProduct = await product.save();
  res.status(201).json(createdProduct);
});

/**
 * @description Update a product
 * @route PUT /api/products/:id
 * @access private/admin
 */
const updateProduct = asyncHandler(async (req, res) => {
  const { name, price, description, image, brand, category, countInStock } =
    req.body;

  const product = await Product.findById(req.params.id);

  if (product) {
    product.name = name;
    product.price = price;
    product.description = description;
    product.image = image;
    product.brand = brand;
    product.category = category;
    product.countInStock = countInStock;

    const updatedProduct = await product.save();
    res.json(updatedProduct);
  } else {
    res.status(404);
    throw new Error("Product Not Found");
  }
});

/**
 * @description Create new review
 * @route POST /api/products/:id/reviews
 * @access private
 */
const createProductReview = asyncHandler(async (req, res) => {
  const reqWithUser = req as typeof req & { user: IUser };

  const { rating, comment } = reqWithUser.body;

  const product = await Product.findById(reqWithUser.params.id);

  if (product) {
    const alreadyReviewed = product.reviews.find(
      (r) => r.user.toString() === reqWithUser.user._id.toString(),
    );

    if (alreadyReviewed) {
      res.status(400);
      throw new Error("Product alrady reviewed");
    }

    const review = {
      name: reqWithUser.user.name,
      rating: Number(rating),
      comment,
      user: reqWithUser.user._id,
    };

    product.reviews.push(review);

    product.numReviews = product.reviews.length;

    product.rating =
      product.reviews.reduce((acc, item) => item.rating + acc, 0) /
      product.reviews.length;

    await product.save();

    res.status(201).json({ message: "reeview added" });
  } else {
    res.status(404);
    throw new Error("Product Not Found");
  }
});

/**
 * @description Get top rated products
 * @route GET /api/products/top
 * @access public
 */
const getTopProducts = asyncHandler(async (req, res) => {
  const products = await Product.find({}).sort({ rating: -1 }).limit(3);
  res.json(products);
});

export {
  getProducts,
  getProductById,
  deleteProduct,
  createProduct,
  updateProduct,
  createProductReview,
  getTopProducts,
};
