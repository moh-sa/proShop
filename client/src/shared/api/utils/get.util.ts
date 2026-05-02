import { api } from "@/lib";
import type z from "zod";
import { ClientApiError, normalizeError } from "../error";
import {
	createApiResponseSchema,
	createPaginatedResponseSchema,
} from "../schemas";
import type { ApiPaginatedResponse } from "../types";

async function _get<TData>(
	url: string,
	dataSchema: z.ZodType<TData>,
	signal: AbortSignal,
) {
	let response;

	try {
		response = await api.get(url, { signal });
	} catch (error) {
		throw new ClientApiError(normalizeError(error));
	}

	const parsedResponse = dataSchema.safeParse(response.data);
	if (!parsedResponse.success) {
		throw new ClientApiError(normalizeError(parsedResponse.error, "response"));
	}

	return parsedResponse.data;
}

export async function get<TData>(
	url: string,
	dataSchema: z.ZodType<TData>,
	signal: AbortSignal,
): Promise<TData> {
	const response = await _get(url, createApiResponseSchema(dataSchema), signal);
	return response.data;
}

export async function getPaginated<TData>(
	url: string,
	dataSchema: z.ZodType<TData>,
	signal: AbortSignal,
): Promise<ApiPaginatedResponse<TData>> {
	const response = await _get(
		url,
		createPaginatedResponseSchema(dataSchema),
		signal,
	);

	return response;
}
