import { api } from "@/lib";
import type z from "zod";
import { ClientApiError, normalizeError } from "../error";
import { createApiResponseSchema } from "../schemas";

export async function postFormData<TData>(
	url: string,
	data: FormData,
	dataSchema: z.ZodType<TData>,
): Promise<TData> {
	let response;

	try {
		response = await api.post(url, data, {
			headers: { "Content-Type": "multipart/form-data" },
		});
	} catch (error) {
		throw new ClientApiError(normalizeError(error));
	}

	const parsedResponse = createApiResponseSchema(dataSchema).safeParse(
		response.data,
	);
	if (!parsedResponse.success) {
		throw new ClientApiError(
			normalizeError(parsedResponse.error, "response"),
		);
	}

	return parsedResponse.data.data;
}
