import { insertOrderSchema } from "../schemas";
import { orderService } from "../services";
import { asyncHandler } from "../utils";
import { objectIdValidator } from "../validators";

class OrderController {
  private readonly service = orderService;

  create = asyncHandler(async (req, res) => {
    const data = insertOrderSchema.parse({
      ...req.body,
      user: res.locals.user._id,
    });

    const response = await this.service.create(data);

    res.status(201).json(response);
  });

  getById = asyncHandler(async (req, res) => {
    const orderId = objectIdValidator.parse(req.params.id);

    const order = await this.service.getById({ orderId });

    res.status(200).json(order);
  });

  getAll = asyncHandler(async (req, res) => {
    const orders = await this.service.getAll();

    res.status(200).json(orders);
  });

  getUser = asyncHandler(async (req, res) => {
    const userId = res.locals.user._id;

    const orders = await this.service.getUserOrders({ userId });

    res.status(200).json(orders);
  });

  updateToPaid = asyncHandler(async (req, res) => {
    const orderId = objectIdValidator.parse(req.params.id);

    const order = await this.service.updateToPaid({ orderId });

    res.status(200).json(order);
  });

  updateToDelivered = asyncHandler(async (req, res) => {
    const orderId = objectIdValidator.parse(req.params.id);

    const order = await this.service.updateToDelivered({ orderId });

    res.status(200).json(order);
  });
}
export const orderController = new OrderController();
