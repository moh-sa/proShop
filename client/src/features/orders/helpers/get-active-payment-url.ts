import { isOlderThan24Hours } from "@/shared/utils";
import type { OrderListItem } from "../types";

/**
 * Returns the active payment URL for an order if it is pending and not older than 24 hours
 */
export function getActivePaymentUrl(order: OrderListItem) {
	if (order.status === "pending" && !isOlderThan24Hours(order.createdAt)) {
		return order.payment.sessionURL;
	}

	return undefined;
}
