import mongoose, { Error as MongooseError, Types } from "mongoose";
import { DatabaseError } from "../errors";
import Order from "../models/orderModel";
import { InsertOrder, SelectOrder } from "../types";

export interface IOrderRepository {
  create(data: InsertOrder): Promise<SelectOrder>;
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
  getAll(): Promise<Array<SelectOrder>>;
  getAllByUserId(data: { userId: Types.ObjectId }): Promise<Array<SelectOrder>>;
}
export class OrderRepository implements IOrderRepository {
  private readonly db: typeof Order;

  constructor(db: typeof Order = Order) {
    this.db = db;
  }

  async create(data: InsertOrder): Promise<SelectOrder> {
    try {
      return (await this.db.create(data)).toObject();
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

  async getAll(): Promise<Array<SelectOrder>> {
    try {
      return await this.db
        .find({})
        .select("id createdAt isPaid paidAt isDelivered deliveredAt totalPrice")
        .lean();
    } catch (error) {
      this.errorHandler(error);
    }
  }

  async getAllByUserId({
    userId,
  }: {
    userId: Types.ObjectId;
  }): Promise<Array<SelectOrder>> {
    try {
      return await this.db
        .find({ user: userId })
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
