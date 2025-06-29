import { Types } from "mongoose";
import Order from "../models/orderModel";
import { InsertOrder, SelectOrder } from "../types";
import { handleDatabaseError } from "../utils";

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
  private readonly _db: typeof Order;

  constructor(db: typeof Order = Order) {
    this._db = db;
  }

  async create(data: InsertOrder): Promise<SelectOrder> {
    try {
      return (await this._db.create(data)).toObject();
    } catch (error) {
      this._errorHandler(error);
    }
  }

  async getById({
    orderId,
  }: {
    orderId: Types.ObjectId;
  }): Promise<SelectOrder | null> {
    try {
      return await this._db
        .findById(orderId)
        .populate("user", "name email")
        .lean();
    } catch (error) {
      this._errorHandler(error);
    }
  }

  async updateToDelivered({
    orderId,
  }: {
    orderId: Types.ObjectId;
  }): Promise<SelectOrder | null> {
    try {
      return await this._db
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
      this._errorHandler(error);
    }
  }

  async updateToPaid({
    orderId,
  }: {
    orderId: Types.ObjectId;
  }): Promise<SelectOrder | null> {
    try {
      return await this._db
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
      this._errorHandler(error);
    }
  }

  async getAll(): Promise<Array<SelectOrder>> {
    try {
      return await this._db
        .find({})
        .select("id createdAt isPaid paidAt isDelivered deliveredAt totalPrice")
        .lean();
    } catch (error) {
      this._errorHandler(error);
    }
  }

  async getAllByUserId({
    userId,
  }: {
    userId: Types.ObjectId;
  }): Promise<Array<SelectOrder>> {
    try {
      return await this._db
        .find({ user: userId })
        .select("id createdAt isPaid paidAt isDelivered deliveredAt totalPrice")
        .lean();
    } catch (error) {
      this._errorHandler(error);
    }
  }

  private _errorHandler(error: unknown): never {
    return handleDatabaseError(error);
  }
}
