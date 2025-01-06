import asyncHandler from "express-async-handler";
import mongoose from "mongoose";
import Product from "../models/productModel";
import { TSelectReview } from "../types";
import { handleErrorResponse, isExist } from "../utils";
import { isReviewed } from "../utils/is-reviewed.util";

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
  if (!isExist(product))
    return handleErrorResponse(res, 404, "Product not found");

  res.json(product);
});

/**
 * @description Delete a product
 * @route DELETE /api/products/:id
 * @access private/admin
 */
const deleteProduct = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);
  if (!isExist(product))
    return handleErrorResponse(res, 404, "Product not found");

  await product.remove();
  res.json({ message: "Product removed" });
});

/**
 * @description Create a product
 * @route POST /api/products
 * @access private/admin
 */
const createProduct = asyncHandler(async (_, res) => {
  // TODO: wth is this? Create a real product!
  const product = new Product({
    user: res.locals.user._id,
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
  if (!isExist(product))
    return handleErrorResponse(res, 404, "Product not found");

  product.name = name;
  product.price = price;
  product.description = description;
  product.image = image;
  product.brand = brand;
  product.category = category;
  product.countInStock = countInStock;

  const updatedProduct = await product.save();
  res.json(updatedProduct);
});

/**
 * @description Create new review
 * @route POST /api/products/:id/reviews
 * @access private
 */
const createProductReview = asyncHandler(async (req, res) => {
  const { rating, comment } = req.body;

  const product = await Product.findById(req.params.id);
  if (!isExist(product))
    return handleErrorResponse(res, 404, "Product not found");

  if (isReviewed(product, res.locals.user))
    handleErrorResponse(res, 400, "Product already reviewed");

  const review: TSelectReview = {
    _id: new mongoose.Types.ObjectId(),
    name: res.locals.user.name,
    rating: Number(rating),
    comment,
    user: res.locals.user._id,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  product.reviews.push(review);
  product.numReviews = product.reviews.length;

  product.rating =
    product.reviews.reduce((acc, item) => item.rating + acc, 0) /
    product.reviews.length;

  await product.save();

  res.status(201).json({ message: "review added" });
});

/**
 * @description Get top rated products
 * @route GET /api/products/top
 * @access public
 */
const getTopProducts = asyncHandler(async (_, res) => {
  const products = await Product.find({}).sort({ rating: -1 }).limit(3);
  res.json(products);
});

export {
  createProduct,
  createProductReview,
  deleteProduct,
  getProductById,
  getProducts,
  getTopProducts,
  updateProduct,
};
