import { queryOptions } from "@tanstack/react-query";
import { fetchMeApi } from "../api";
import { authKeys } from "./keys";

export const getMeQueryOptions = queryOptions({
	queryKey: authKeys.me(),
	queryFn: ({ signal }) => fetchMeApi(signal),
	staleTime: 5 * 60 * 1000, // 5 minutes
	gcTime: 24 * 60 * 60 * 1000, // 24 hours

	refetchOnWindowFocus: true,
	refetchOnReconnect: true,
	refetchInterval: 5 * 60 * 1000, // 5 minutes

	retry: false,
});
