import { queryOptions } from "@tanstack/react-query";
import { fetchMeApi } from "../api";
import { authKeys } from "./keys";

export const getMeQueryOptions = queryOptions({
	queryKey: authKeys.me(),
	queryFn: ({ signal }) => fetchMeApi(signal),
	staleTime: 15 * 60 * 1000, // 15 minutes
	refetchInterval: 15 * 60 * 1000, // 15 minutes
	refetchOnWindowFocus: false,
	retry: false,
});
