import express from "express";
import { orderController as controller } from "../controllers";
import { checkJwtTokenValidation, checkUserIdExists } from "../middlewares";
const router = express.Router();

router
  .route("/")
  .post(checkJwtTokenValidation, checkUserIdExists, controller.create)
  .get(checkJwtTokenValidation, checkUserIdExists, controller.getAll);

router
  .route("/myorders")
  .get(checkJwtTokenValidation, checkUserIdExists, controller.getUser);

router
  .route("/:id")
  .get(checkJwtTokenValidation, checkUserIdExists, controller.getById);

router
  .route("/:id/pay")
  .put(checkJwtTokenValidation, checkUserIdExists, controller.updateToPaid);

router
  .route("/:id/deliver")
  .put(
    checkJwtTokenValidation,
    checkUserIdExists,
    controller.updateToDelivered,
  );

export default router;
