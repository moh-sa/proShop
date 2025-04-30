import { insertOrderSchema } from "../schemas";
import { orderService } from "../services";
import { asyncHandler, sendSuccessResponse } from "../utils";
import { objectIdValidator } from "../validators";

class OrderController {
  private readonly service = orderService;

  create = asyncHandler(async (req, res) => {
    const data = insertOrderSchema.parse({
      ...req.body,
      user: res.locals.user._id,
    });

    const response = await this.service.create(data);

    return sendSuccessResponse({
      res,
      statusCode: 201,
      data: response,
    });
  });

  getById = asyncHandler(async (req, res) => {
    const orderId = objectIdValidator.parse(req.params.orderId);

    const order = await this.service.getById({ orderId });

    return sendSuccessResponse({
      res,
      statusCode: 200,
      data: order,
    });
  });

  getAll = asyncHandler(async (req, res) => {
    const orders = await this.service.getAll();

    return sendSuccessResponse({
      res,
      statusCode: 200,
      data: orders,
    });
  });

  getAllByUserId = asyncHandler(async (req, res) => {
    const userId = objectIdValidator.parse(req.params.userId);

    const orders = await this.service.getAllByUserId({ userId });

    return sendSuccessResponse({
      res,
      statusCode: 200,
      data: orders,
    });
  });

  updateToPaid = asyncHandler(async (req, res) => {
    const orderId = objectIdValidator.parse(req.params.orderId);

    const order = await this.service.updateToPaid({ orderId });

    return sendSuccessResponse({
      res,
      statusCode: 200,
      data: order,
    });
  });

  updateToDelivered = asyncHandler(async (req, res) => {
    const orderId = objectIdValidator.parse(req.params.orderId);

    const order = await this.service.updateToDelivered({ orderId });

    return sendSuccessResponse({
      res,
      statusCode: 200,
      data: order,
    });
  });
}
export const orderController = new OrderController();
