import {
	FREE_SHIPPING_THRESHOLD,
	STANDARD_SHIPPING_PRICE,
	TAX_RATE,
} from "../consts/orders.const";

/**
 * Calculate the order pricing based on the subtotal.
 */
export function calculateOrderPricing(subtotal: number) {
	const shippingPrice =
		subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : STANDARD_SHIPPING_PRICE;
	const taxPrice = (subtotal + shippingPrice) * TAX_RATE;
	const totalPrice = subtotal + shippingPrice + taxPrice;

	return { subtotal, shippingPrice, taxPrice, totalPrice };
}
