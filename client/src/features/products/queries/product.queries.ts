import { queryOptions } from "@tanstack/react-query";
import { productTopRatedListApi } from "../api";
import { productKeys } from "./product.keys";

export const productTopRatedListQueryOptions = queryOptions({
	queryKey: productKeys.topRated(),
	queryFn: ({ signal }) => productTopRatedListApi(signal),
	refetchOnWindowFocus: false,
});
