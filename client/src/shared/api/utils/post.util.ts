import { api } from "@/lib";
import type z from "zod";
import { ClientApiError, normalizeError } from "../error";
import {
	createApiResponseSchema,
	createPaginatedResponseSchema,
} from "../schemas";
import type { ApiPaginatedResponse } from "../types";

async function _post<TData>(
	url: string,
	data: unknown,
	dataSchema: z.ZodType<TData>,
) {
	let response;

	try {
		response = await api.post(url, data);
	} catch (error) {
		throw new ClientApiError(normalizeError(error));
	}

	const parsedResponse = dataSchema.safeParse(response.data);
	if (!parsedResponse.success) {
		throw new ClientApiError(normalizeError(parsedResponse.error, "response"));
	}

	return parsedResponse.data;
}

export async function post<TData>(
	url: string,
	data: unknown,
	dataSchema: z.ZodType<TData>,
): Promise<TData> {
	const response = await _post(url, data, createApiResponseSchema(dataSchema));

	return response.data;
}

export async function postPaginated<TData>(
	url: string,
	data: unknown,
	dataSchema: z.ZodType<TData>,
): Promise<ApiPaginatedResponse<TData>> {
	const response = await _post(
		url,
		data,
		createPaginatedResponseSchema(dataSchema),
	);

	return response;
}
