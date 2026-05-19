import { get } from "@/shared/api";
import { queryOptions } from "@tanstack/react-query";
import {
	ORDER_STATUS_PENDING_STALE_TIME,
	ORDER_STATUS_POLL_INTERVAL,
	ORDER_STATUS_POLL_MAX_ATTEMPTS,
} from "../consts";
import { orderSchema } from "../schemas";
import { orderKeys } from "./order.keys";

export function orderDetailQueryOptions(orderId: string) {
	return queryOptions({
		queryKey: orderKeys.detail(orderId),
		queryFn: async ({ signal }) => {
			const response = await get(`/orders/${orderId}`, orderSchema, signal);
			return response;
		},
	});
}

export function orderDetailSuccessQueryOptions(orderId: string) {
	return queryOptions({
		...orderDetailQueryOptions(orderId),

		// poll for order status until it is no longer pending
		refetchInterval(query) {
			const status = query.state.data?.status;
			const attempts = query.state.dataUpdateCount;

			if (status === "processing") return false;
			if (attempts >= ORDER_STATUS_POLL_MAX_ATTEMPTS) return false; //give up gracefully

			return ORDER_STATUS_POLL_INTERVAL;
		},

		// never stale while order is pending
		staleTime(query) {
			const status = query.state.data?.status;
			const attempts = query.state.dataUpdateCount;

			if (status === "pending" && attempts < ORDER_STATUS_POLL_MAX_ATTEMPTS) {
				return ORDER_STATUS_PENDING_STALE_TIME;
			}

			// never stale after processing or after max attempts
			return Infinity;
		},
		refetchOnWindowFocus: false,
	});
}

export function orderDetailFailureQueryOptions(orderId: string) {
	return queryOptions({
		...orderDetailQueryOptions(orderId),
		staleTime: Infinity, // never stale in failure case
	});
}
