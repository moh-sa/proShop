import { Types } from "mongoose";
import { EmptyCartError, NotFoundError } from "../errors";
import { orderRepository } from "../repositories";
import { InsertOrder, SelectOrder } from "../types";

class OrderService {
  private readonly repository = orderRepository;

  async create(data: InsertOrder): Promise<SelectOrder> {
    if (data.orderItems && data.orderItems.length === 0) {
      throw new EmptyCartError();
    }

    return await this.repository.createOrder({ orderData: data });
  }

  async getById({
    orderId,
  }: {
    orderId: Types.ObjectId;
  }): Promise<SelectOrder> {
    const order = await this.repository.getOrderById({ orderId });
    if (!order) throw new NotFoundError("Order");

    return order;
  }

  async getAll(): Promise<Array<SelectOrder>> {
    return await this.repository.getAll();
  }

  async getUserOrders({
    userId,
  }: {
    userId: Types.ObjectId;
  }): Promise<Array<SelectOrder>> {
    return await this.repository.getAll(userId);
  }

  async updateToPaid({
    orderId,
  }: {
    orderId: Types.ObjectId;
  }): Promise<SelectOrder> {
    const updatedOrder = await this.repository.updateOrderToPaid({ orderId });
    if (!updatedOrder) throw new NotFoundError("Order");

    return updatedOrder;
  }

  async updateToDelivered({
    orderId,
  }: {
    orderId: Types.ObjectId;
  }): Promise<SelectOrder> {
    const updatedOrder = await this.repository.updateOrderToDelivered({
      orderId,
    });
    if (!updatedOrder) throw new NotFoundError("Order");

    return updatedOrder;
  }
}

export const orderService = new OrderService();
