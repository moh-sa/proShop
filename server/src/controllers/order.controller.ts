import { Request, Response } from "express";
import { Types } from "mongoose";
import { orderService } from "../services";
import { InsertOrder } from "../types";

class OrderController {
  private readonly service = orderService;

  create = async (req: Request, res: Response) => {
    const data: InsertOrder = {
      ...req.body,
      user: res.locals.user._id,
    };
    try {
      const createdOrder = await this.service.create(data);
      res.status(201).json(createdOrder);
    } catch (error) {
      console.error(error);
      if (error instanceof Error) {
        return res.status(400).json({ message: error.message });
      }
      return res.status(500).json({ message: "Internal server error." });
    }
  };

  getById = async (req: Request, res: Response) => {
    const orderId = req.params.id as unknown as Types.ObjectId;
    try {
      const order = await this.service.getById({ orderId });
      res.status(200).json(order);
    } catch (error) {
      console.error(error);
      if (error instanceof Error) {
        return res.status(400).json({ message: error.message });
      }
      return res.status(500).json({ message: "Internal server error." });
    }
  };

  getAll = async (req: Request, res: Response) => {
    try {
      const orders = await this.service.getAll();
      res.status(200).json(orders);
    } catch (error) {
      console.error(error);
      if (error instanceof Error) {
        return res.status(400).json({ message: error.message });
      }
      return res.status(500).json({ message: "Internal server error." });
    }
  };

  getUser = async (req: Request, res: Response) => {
    const userId = res.locals.user._id as unknown as Types.ObjectId; // TODO: fix type
    try {
      const orders = await this.service.getUserOrders({ userId });
      res.status(200).json(orders);
    } catch (error) {
      console.error(error);
      if (error instanceof Error) {
        return res.status(400).json({ message: error.message });
      }
      return res.status(500).json({ message: "Internal server error." });
    }
  };

  updateToPaid = async (req: Request, res: Response) => {
    const orderId = req.params.id as unknown as Types.ObjectId;
    try {
      const order = await this.service.updateToPaid({ orderId });
      res.status(200).json(order);
    } catch (error) {
      console.error(error);
      if (error instanceof Error) {
        return res.status(400).json({ message: error.message });
      }
      return res.status(500).json({ message: "Internal server error." });
    }
  };

  updateToDelivered = async (req: Request, res: Response) => {
    const orderId = req.params.id as unknown as Types.ObjectId;
    try {
      const order = await this.service.updateToDelivered({ orderId });
      res.status(200).json(order);
    } catch (error) {
      console.error(error);
      if (error instanceof Error) {
        return res.status(400).json({ message: error.message });
      }
      return res.status(500).json({ message: "Internal server error." });
    }
  };
}
export const orderController = new OrderController();
