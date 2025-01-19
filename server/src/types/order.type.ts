import { z } from "zod";
import { insertOrderSchema, selectOrderSchema } from "../schemas";

export type InsertOrder = z.infer<typeof insertOrderSchema>;
export type SelectOrder = z.infer<typeof selectOrderSchema>;
export type OrderSchema = SelectOrder;
