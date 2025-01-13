import express from "express";
import { productController as controller } from "../controllers";
import {
  checkIfUserIsAdmin,
  checkJwtTokenValidation,
  checkProductReviewedByUser,
  checkUserIdExists,
} from "../middlewares";
const router = express.Router();

router
  .route("/")
  .get(controller.getAll)
  .post(
    checkJwtTokenValidation,
    checkUserIdExists,
    checkIfUserIsAdmin,
    controller.create,
  );

router.route("/top").get(controller.getTopRated);

router
  .route("/:id")
  .get(controller.getById)
  .delete(
    checkJwtTokenValidation,
    checkUserIdExists,
    checkIfUserIsAdmin,
    controller.delete,
  )
  .put(
    checkJwtTokenValidation,
    checkUserIdExists,
    checkIfUserIsAdmin,
    controller.update,
  );

router
  .route("/:id/reviews")
  .post(
    checkJwtTokenValidation,
    checkUserIdExists,
    checkProductReviewedByUser,
    controller.createReview,
  );

export default router;
