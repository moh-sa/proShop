import { InsertOrder, SelectOrder } from "../../types";
import { fromCurrencySmallestUnit, toCurrencySmallestUnit } from "../../utils";

export function toCents(amount: number): number {
	return toCurrencySmallestUnit({
		amount,
		currency: "USD",
	});
}

export function toDollars(amount: number): number {
	return fromCurrencySmallestUnit({
		amount,
		currency: "USD",
	});
}

export function convertOrderToCents<T extends InsertOrder | SelectOrder>(
	order: T,
): T {
	return {
		...order,
		itemsPrice: toCents(order.itemsPrice),
		orderItems: order.orderItems.map((item) => ({
			...item,
			price: toCents(item.price),
		})),
		shippingPrice: toCents(order.shippingPrice),
		taxPrice: toCents(order.taxPrice),
		totalPrice: toCents(order.totalPrice),
	};
}

export function convertOrderToDollars<T extends InsertOrder | SelectOrder>(
	order: T,
): T {
	return {
		...order,
		itemsPrice: toDollars(order.itemsPrice),
		orderItems: order.orderItems.map((item) => ({
			...item,
			price: toDollars(item.price),
		})),
		shippingPrice: toDollars(order.shippingPrice),
		taxPrice: toDollars(order.taxPrice),
		totalPrice: toDollars(order.totalPrice),
	};
}

export function normalizeOrderPrices<T extends InsertOrder | SelectOrder>(
	order: T,
): T {
	return convertOrderToDollars(convertOrderToCents(order));
}
