import type z from "zod";
import type { cartItemSchema, cartItemToAddSchema } from "../schemas";

export type CartItemToAdd = z.infer<typeof cartItemToAddSchema>;
export type CartItem = z.infer<typeof cartItemSchema>;
