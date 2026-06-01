import {
	adminCancelOrderApi,
	markOrderAsDeliveredApi,
} from "@/features/orders/api/orders.api";
import { orderKeys } from "@/features/orders/queries/order.keys";
import {
	createProductApi,
	deleteProductApi,
	updateProductApi,
} from "@/features/products/api/product.api";
import { productKeys } from "@/features/products/queries/product.keys";
import { adminDeleteReviewApi } from "@/features/reviews/api/reviews.api";
import { reviewKeys } from "@/features/reviews/queries/reviews.keys";
import { deleteUserApi, updateUserApi } from "@/features/users/api/users.api";
import { userKeys } from "@/features/users/queries/user.keys";
import { mutationOptions } from "@tanstack/react-query";
import { adminKeys } from "./admin.keys";

export const createProductMutationOptions = mutationOptions({
	mutationFn: createProductApi,
	onSuccess(_data, _variables, _onMutateResult, context) {
		context.client.invalidateQueries({ queryKey: productKeys.all });
		context.client.invalidateQueries({ queryKey: adminKeys.all });
	},
});

export const updateProductMutationOptions = mutationOptions({
	mutationFn: updateProductApi,
	onSuccess(_data, _variables, _onMutateResult, context) {
		context.client.invalidateQueries({ queryKey: productKeys.all });
		context.client.invalidateQueries({ queryKey: adminKeys.all });
	},
});

export const deleteProductMutationOptions = mutationOptions({
	mutationFn: (productId: string) => deleteProductApi(productId),
	onSuccess(_data, _variables, _onMutateResult, context) {
		context.client.invalidateQueries({ queryKey: productKeys.all });
		context.client.invalidateQueries({ queryKey: adminKeys.all });
	},
});

export const adminDeleteReviewMutationOptions = mutationOptions({
	mutationFn: (reviewId: string) => adminDeleteReviewApi(reviewId),
	onSuccess(_data, _variables, _onMutateResult, context) {
		context.client.invalidateQueries({ queryKey: reviewKeys.all });
		context.client.invalidateQueries({ queryKey: productKeys.all });
		context.client.invalidateQueries({ queryKey: adminKeys.all });
	},
});

export const markAsDeliveredMutationOptions = mutationOptions({
	mutationFn: (orderId: string) => markOrderAsDeliveredApi(orderId),
	onSuccess(_data, _variables, _onMutateResult, context) {
		context.client.invalidateQueries({ queryKey: orderKeys.all });
		context.client.invalidateQueries({ queryKey: adminKeys.all });
	},
});

export const adminCancelOrderMutationOptions = mutationOptions({
	mutationFn: (orderId: string) => adminCancelOrderApi(orderId),
	onSuccess(_data, _variables, _onMutateResult, context) {
		context.client.invalidateQueries({ queryKey: orderKeys.all });
		context.client.invalidateQueries({ queryKey: adminKeys.all });
	},
});

export const updateUserMutationOptions = mutationOptions({
	mutationFn: updateUserApi,
	onSuccess(_data, _variables, _onMutateResult, context) {
		context.client.invalidateQueries({ queryKey: userKeys.all });
	},
});

export const deleteUserMutationOptions = mutationOptions({
	mutationFn: (userId: string) => deleteUserApi(userId),
	onSuccess(_data, _variables, _onMutateResult, context) {
		context.client.invalidateQueries({ queryKey: userKeys.all });
		context.client.invalidateQueries({ queryKey: adminKeys.all });
	},
});
