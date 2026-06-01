import {
	paginationParamsSchema,
	type PaginationParams,
} from "@/features/pagination";
import {
	buildSearchParams,
	ClientApiError,
	del,
	get,
	getPaginated,
	normalizeError,
	patchFormData,
	postFormData,
	type ApiPaginatedResponse,
} from "@/shared/api";
import { idSchema } from "@/shared/schemas";
import {
	createProductSchema,
	ProductListItemSchema,
	productSchema,
	productSearchParamsSchema,
	productTopRatedListSchema,
	updateProductSchema,
} from "../schemas";
import type {
	CreateProductFormInput,
	Product,
	ProductListItem,
	ProductSearchParams,
	ProductTopRatedList,
	UpdateProductFormInput,
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

export async function createProductApi(
	data: CreateProductFormInput,
): Promise<Product> {
	const parsedData = createProductSchema.safeParse(data);
	if (!parsedData.success) {
		throw new ClientApiError(normalizeError(parsedData.error, "input"));
	}

	const formData = new FormData();
	formData.append("name", parsedData.data.name);
	formData.append("description", parsedData.data.description);
	formData.append("brand", parsedData.data.brand);
	formData.append("category", parsedData.data.category);
	formData.append("price", String(parsedData.data.price));
	formData.append("countInStock", String(parsedData.data.countInStock));
	formData.append("image", parsedData.data.image);

	return await postFormData("/products", formData, productSchema);
}

export async function updateProductApi(
	data: UpdateProductFormInput,
): Promise<Product> {
	const parsedData = updateProductSchema.safeParse(data);
	if (!parsedData.success) {
		throw new ClientApiError(normalizeError(parsedData.error, "input"));
	}

	const { productId, ...fields } = parsedData.data;

	const formData = new FormData();
	if (fields.name) formData.append("name", fields.name);
	if (fields.description) formData.append("description", fields.description);
	if (fields.brand) formData.append("brand", fields.brand);
	if (fields.category) formData.append("category", fields.category);
	if (fields.price !== undefined) formData.append("price", String(fields.price));
	if (fields.countInStock !== undefined)
		formData.append("countInStock", String(fields.countInStock));
	if (fields.image) formData.append("image", fields.image);

	return await patchFormData(`/products/${productId}`, formData, productSchema);
}

export async function deleteProductApi(productId: string): Promise<void> {
	const parsedId = idSchema.safeParse(productId);
	if (!parsedId.success) {
		throw new ClientApiError(normalizeError(parsedId.error, "input"));
	}

	return await del(`/products/${parsedId.data}`);
}

export async function getAdminProductsApi(
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
