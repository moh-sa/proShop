import express from "express";
import { reviewController as controller } from "../../controllers";

const router = express.Router();

router.get("/", controller.getAll); // admin
router.post("/", controller.create); // user

router.get("/user/:userId", controller.getAllByUserId); // user

router.get("/product/:productId", controller.getAllByProductId); // public

router.get("/count", controller.count); // admin
router.get("/count/user/:userId", controller.countByUserId); // user
router.get("/count/product/:productId", controller.countByProductId); // public

router.get("/exists/:reviewId", controller.existsById); // admin
router.get(
  "/exists/user/:userId/product/:productId",
  controller.existsByUserIdAndProductId,
); // user

router.get("/:reviewId", controller.getById); // admin
router.put("/:reviewId", controller.update); // user
router.delete("/:reviewId", controller.delete); // user

export default router;
