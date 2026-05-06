import {
	paginationParamsSchema,
	type PaginationParams,
} from "@/features/pagination";
import {
	ClientApiError,
	get,
	getPaginated,
	normalizeError,
	type ApiPaginatedResponse,
} from "@/shared/api";
import { ProductListItemSchema, productTopRatedListSchema } from "../schemas";
import type { ProductListItem, ProductTopRatedList } from "../types";

export async function productTopRatedListApi(
	signal: AbortSignal,
): Promise<ProductTopRatedList> {
	return await get("/products/top-rated", productTopRatedListSchema, signal);
}

export async function productPaginatedListApi(
	params: PaginationParams,
	signal: AbortSignal,
): Promise<ApiPaginatedResponse<ProductListItem>> {
	const parsedParams = paginationParamsSchema.safeParse(params);
	if (!parsedParams.success) {
		throw new ClientApiError(normalizeError(parsedParams.error, "input"));
	}

	return await getPaginated(
		`/products?pageNumber=${parsedParams.data.pageNumber}&pageSize=${parsedParams.data.pageSize}`,
		ProductListItemSchema,
		signal,
	);
}
