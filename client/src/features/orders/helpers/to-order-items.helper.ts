import type { CartItem } from "@/features/cart";
import type { OrderItem } from "../types";

export function toOrderItems(items: Array<CartItem>): Array<OrderItem> {
	return items.map((item) => ({
		name: item.name,
		price: item.price,
		image: item.image,
		productId: item.id,
		qty: item.quantity,
	}));
}
