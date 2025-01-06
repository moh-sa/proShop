import express from "express";
import {
  addOrderItems,
  getMyOrders,
  getOrderById,
  getOrders,
  updateOrderToDelivered,
  updateOrderToPaid,
} from "../controllers/orderController";
import { checkJwtTokenValidation, checkUserIdExists } from "../middlewares";
const router = express.Router();

router
  .route("/")
  .post(checkJwtTokenValidation, checkUserIdExists, addOrderItems)
  .get(checkJwtTokenValidation, checkUserIdExists, getOrders);

router
  .route("/myorders")
  .get(checkJwtTokenValidation, checkUserIdExists, getMyOrders);

router
  .route("/:id")
  .get(checkJwtTokenValidation, checkUserIdExists, getOrderById);

router
  .route("/:id/pay")
  .put(checkJwtTokenValidation, checkUserIdExists, updateOrderToPaid);

router
  .route("/:id/deliver")
  .put(checkJwtTokenValidation, checkUserIdExists, updateOrderToDelivered);

export default router;
