import { mutationOptions } from "@tanstack/react-query";
import { createOrderApi } from "../api/orders.api";
import { orderKeys } from "./order.keys";

export const createOrderMutationOptions = mutationOptions({
	mutationFn: createOrderApi,
	onSuccess(data, _variables, _onMutateResult, context) {
		context.client.setQueryData(orderKeys.detail(data.order.id), data.order);
	},
});
