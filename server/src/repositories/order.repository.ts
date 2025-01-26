import mongoose, { Types } from "mongoose";
import { DatabaseError } from "../errors";
import Order from "../models/orderModel";
import { InsertOrder, SelectOrder } from "../types";

class OrderRepository {
  async createOrder({
    orderData,
  }: {
    orderData: InsertOrder;
  }): Promise<SelectOrder> {
    try {
      return await Order.create(orderData);
    } catch (error) {
      this.errorHandler(error);
    }
  }

  async getOrderById({
    orderId,
  }: {
    orderId: Types.ObjectId;
  }): Promise<SelectOrder | null> {
    try {
      return await Order.findById(orderId).populate("user", "name email");
    } catch (error) {
      this.errorHandler(error);
    }
  }

  async updateOrderToDelivered({
    orderId,
  }: {
    orderId: Types.ObjectId;
  }): Promise<SelectOrder | null> {
    try {
      return await Order.findByIdAndUpdate(
        orderId,
        {
          $set: {
            isDelivered: true,
            deliveredAt: new Date(),
          },
        },
        { new: true },
      );
    } catch (error) {
      this.errorHandler(error);
    }
  }

  async updateOrderToPaid({
    orderId,
  }: {
    orderId: Types.ObjectId;
  }): Promise<SelectOrder | null> {
    try {
      return await Order.findByIdAndUpdate(
        orderId,
        {
          $set: {
            isPaid: true,
            paidAt: new Date(),
          },
        },
        {
          new: true,
        },
      );
    } catch (error) {
      this.errorHandler(error);
    }
  }

  async getAll(userId?: Types.ObjectId): Promise<Array<SelectOrder>> {
    try {
      const options = userId ? { user: userId } : {};
      return await Order.find(options).select(
        "id createdAt isPaid paidAt isDelivered deliveredAt totalPrice",
      );
    } catch (error) {
      this.errorHandler(error);
    }
  }

  private errorHandler(error: unknown): never {
    if (error instanceof mongoose.Error) {
      throw new DatabaseError(error.message);
    }
    throw new DatabaseError();
  }
}

export const orderRepository = new OrderRepository();
