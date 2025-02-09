import express from "express";
import { reviewController as controller } from "../../controllers";

const router = express.Router();

router.route("/").get(controller.getAll).post(controller.create);

router
  .route("/:reviewId")
  .get(controller.getById)
  .patch(controller.update)
  .delete(controller.delete);

router.route("/:userId").get(controller.getAllByUserId);

router.route("/count/:productId").get(controller.count);

router.route("/exists/:userId/:productId").get(controller.exists);

export default router;
