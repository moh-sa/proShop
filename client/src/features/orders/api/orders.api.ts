import { ClientApiError, normalizeError, post } from "@/shared/api";
import { createOrderResponseSchema, createOrderSchema } from "../schemas";
import type { CreateOrder } from "../types";

export async function createOrderApi(data: CreateOrder) {
	const parsedData = createOrderSchema.safeParse(data);
	if (!parsedData.success) {
		throw new ClientApiError(normalizeError(parsedData.error, "input"));
	}

	const response = await post(
		"/orders",
		parsedData.data,
		createOrderResponseSchema,
	);
	return response;
}
