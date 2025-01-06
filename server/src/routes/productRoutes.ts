import express from "express";
import {
  createProduct,
  createProductReview,
  deleteProduct,
  getProductById,
  getProducts,
  getTopProducts,
  updateProduct,
} from "../controllers/productController";
import { getUserByIdMW, isUserAdminMW, verifyTokenMW } from "../middlewares";
const router = express.Router();

router
  .route("/")
  .get(getProducts)
  .post(verifyTokenMW, getUserByIdMW, isUserAdminMW, createProduct);

router.route("/top").get(getTopProducts);

router
  .route("/:id")
  .get(getProductById)
  .delete(verifyTokenMW, getUserByIdMW, isUserAdminMW, deleteProduct)
  .put(verifyTokenMW, getUserByIdMW, isUserAdminMW, updateProduct);

router
  .route("/:id/reviews")
  .post(verifyTokenMW, getUserByIdMW, createProductReview);

export default router;
