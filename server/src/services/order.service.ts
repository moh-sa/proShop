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

    return await this.repository.create({ orderData: data });
  }

  async getById({
    orderId,
  }: {
    orderId: Types.ObjectId;
  }): Promise<SelectOrder> {
    const order = await this.repository.getById({ orderId });
    if (!order) throw new NotFoundError("Order");

    return order;
  }

  async getAll(): Promise<Array<SelectOrder>> {
    return await this.repository.getAll();
  }

  async getAllByUserId({
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
    const updatedOrder = await this.repository.updateToPaid({ orderId });
    if (!updatedOrder) throw new NotFoundError("Order");

    return updatedOrder;
  }

  async updateToDelivered({
    orderId,
  }: {
    orderId: Types.ObjectId;
  }): Promise<SelectOrder> {
    const updatedOrder = await this.repository.updateToDelivered({
      orderId,
    });
    if (!updatedOrder) throw new NotFoundError("Order");

    return updatedOrder;
  }
}

export const orderService = new OrderService();
