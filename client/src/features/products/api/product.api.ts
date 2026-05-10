import {
	paginationParamsSchema,
	type PaginationParams,
} from "@/features/pagination";
import {
	buildSearchParams,
	ClientApiError,
	get,
	getPaginated,
	normalizeError,
	type ApiPaginatedResponse,
} from "@/shared/api";
import { idSchema } from "@/shared/schemas";
import {
	ProductListItemSchema,
	productSchema,
	productSearchParamsSchema,
	productTopRatedListSchema,
} from "../schemas";
import type {
	Product,
	ProductListItem,
	ProductSearchParams,
	ProductTopRatedList,
} from "../types";

export async function productTopRatedListApi(
	signal: AbortSignal,
): Promise<ProductTopRatedList> {
	return await get("/products/top-rated", productTopRatedListSchema, signal);
}

export async function productPaginatedListApi(
	params: PaginationParams,
	signal: AbortSignal,
): Promise<ApiPaginatedResponse<ProductListItem>> {
	const parsedParams = paginationParamsSchema
		.transform(buildSearchParams)
		.safeParse(params);
	if (!parsedParams.success) {
		throw new ClientApiError(normalizeError(parsedParams.error, "input"));
	}

	return await getPaginated(
		`/products?${parsedParams.data}`,
		ProductListItemSchema,
		signal,
	);
}

export async function productSearchListApi(
	params: ProductSearchParams,
	signal: AbortSignal,
): Promise<ApiPaginatedResponse<ProductListItem>> {
	const parsedParams = productSearchParamsSchema
		.extend(paginationParamsSchema.shape)
		.transform(buildSearchParams)
		.safeParse(params);
	if (!parsedParams.success) {
		throw new ClientApiError(normalizeError(parsedParams.error, "input"));
	}

	return await getPaginated(
		`/products?${parsedParams.data}`,
		ProductListItemSchema,
		signal,
	);
}

export async function getProductByIdApi(
	productId: string,
	signal: AbortSignal,
): Promise<Product> {
	const parsedId = idSchema.safeParse(productId);
	if (!parsedId.success) {
		throw new ClientApiError(normalizeError(parsedId.error, "input"));
	}

	return await get(`/products/${parsedId.data}`, productSchema, signal);
}
