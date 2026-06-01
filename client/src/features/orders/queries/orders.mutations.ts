import { mutationOptions } from "@tanstack/react-query";
import { cancelOrderApi, createOrderApi } from "../api/orders.api";
import { orderKeys } from "./order.keys";

export const createOrderMutationOptions = mutationOptions({
	mutationFn: createOrderApi,
	onSuccess(data, _variables, _onMutateResult, context) {
		context.client.setQueryData(orderKeys.detail(data.order.id), data.order);
	},
});

export const cancelOrderMutationOptions = mutationOptions({
	mutationFn: (orderId: string) => cancelOrderApi(orderId),
	onSuccess(_data, _variables, _onMutateResult, context) {
		context.client.invalidateQueries({ queryKey: orderKeys.all });
	},
});
