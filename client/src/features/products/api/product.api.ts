import { get } from "@/shared/api";
import { productTopRatedListSchema } from "../schemas";
import type { ProductTopRatedList } from "../types";

export async function productTopRatedListApi(
	signal: AbortSignal,
): Promise<ProductTopRatedList> {
	return await get("/products/top-rated", productTopRatedListSchema, signal);
}
