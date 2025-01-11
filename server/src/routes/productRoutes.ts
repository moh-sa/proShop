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
import {
  checkIfUserIsAdmin,
  checkJwtTokenValidation,
  checkUserIdExists,
} from "../middlewares";
const router = express.Router();

router
  .route("/")
  .get(getProducts)
  .post(
    checkJwtTokenValidation,
    checkUserIdExists,
    checkIfUserIsAdmin,
    createProduct,
  );

router.route("/top").get(getTopProducts);

router
  .route("/:id")
  .get(getProductById)
  .delete(
    checkJwtTokenValidation,
    checkUserIdExists,
    checkIfUserIsAdmin,
    deleteProduct,
  )
  .put(
    checkJwtTokenValidation,
    checkUserIdExists,
    checkIfUserIsAdmin,
    updateProduct,
  );

router
  .route("/:id/reviews")
  .post(checkJwtTokenValidation, checkUserIdExists, createProductReview);

export default router;
