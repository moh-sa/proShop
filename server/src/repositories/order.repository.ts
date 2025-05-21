import mongoose, { Error as MongooseError, Types } from "mongoose";
import { DatabaseError } from "../errors";
import Order from "../models/orderModel";
import { InsertOrder, SelectOrder } from "../types";

export interface IOrderRepository {
  create({ orderData }: { orderData: InsertOrder }): Promise<SelectOrder>;
  getById({
    orderId,
  }: {
    orderId: Types.ObjectId;
  }): Promise<SelectOrder | null>;
  updateToDelivered({
    orderId,
  }: {
    orderId: Types.ObjectId;
  }): Promise<SelectOrder | null>;
  updateToPaid({
    orderId,
  }: {
    orderId: Types.ObjectId;
  }): Promise<SelectOrder | null>;
  getAll(userId?: Types.ObjectId): Promise<Array<SelectOrder>>;
}
export class OrderRepository implements IOrderRepository {
  private readonly db: typeof Order;

  constructor(db: typeof Order = Order) {
    this.db = db;
  }

  async create({
    orderData,
  }: {
    orderData: InsertOrder;
  }): Promise<SelectOrder> {
    try {
      return (await this.db.create(orderData)).toObject();
    } catch (error) {
      this.errorHandler(error);
    }
  }

  async getById({
    orderId,
  }: {
    orderId: Types.ObjectId;
  }): Promise<SelectOrder | null> {
    try {
      return await this.db
        .findById(orderId)
        .populate("user", "name email")
        .lean();
    } catch (error) {
      this.errorHandler(error);
    }
  }

  async updateToDelivered({
    orderId,
  }: {
    orderId: Types.ObjectId;
  }): Promise<SelectOrder | null> {
    try {
      return await this.db
        .findByIdAndUpdate(
          orderId,
          {
            $set: {
              isDelivered: true,
              deliveredAt: new Date(),
            },
          },
          { new: true },
        )
        .lean();
    } catch (error) {
      this.errorHandler(error);
    }
  }

  async updateToPaid({
    orderId,
  }: {
    orderId: Types.ObjectId;
  }): Promise<SelectOrder | null> {
    try {
      return await this.db
        .findByIdAndUpdate(
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
        )
        .lean();
    } catch (error) {
      this.errorHandler(error);
    }
  }

  async getAll(userId?: Types.ObjectId): Promise<Array<SelectOrder>> {
    try {
      const options = userId ? { user: userId } : {};
      return await this.db
        .find(options)
        .select("id createdAt isPaid paidAt isDelivered deliveredAt totalPrice")
        .lean();
    } catch (error) {
      this.errorHandler(error);
    }
  }

  private errorHandler(error: unknown): never {
    if (
      error instanceof MongooseError ||
      error instanceof mongoose.mongo.MongoError
    ) {
      throw new DatabaseError(error.message);
    }
    throw new DatabaseError();
  }
}
