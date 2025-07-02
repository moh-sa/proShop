import { z } from "zod";
import {
  allOrdersResponseSchema,
  insertOrderSchema,
  selectOrderSchema,
} from "../schemas";
import {
  insertOrderItemSchema,
  selectOrderItemSchema,
} from "../schemas/order/order-item.schema";

export type InsertOrder = z.infer<typeof insertOrderSchema>;
export type SelectOrder = z.infer<typeof selectOrderSchema>;
export type AllOrdersResponse = z.infer<typeof allOrdersResponseSchema>;
export type OrderSchema = SelectOrder;

export type InsertOrderItem = z.infer<typeof insertOrderItemSchema>;
export type SelectOrderItem = z.infer<typeof selectOrderItemSchema>;
