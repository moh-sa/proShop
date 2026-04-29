import { QueryClient } from "@tanstack/react-query";
import { AxiosError } from "axios";

export const queryClient = new QueryClient({
	defaultOptions: {
		queries: {
			// no retry on 4xx errors
			retry: (failureCount, error) => {
				if (
					error instanceof AxiosError &&
					error.status &&
					error.status !== 0 &&
					error.status < 500
				) {
					return false;
				}
				return failureCount < 3;
			},

			// cache result for a short period to prevent duplicate requests
			staleTime: 60 * 1000, // 60 seconds
		},
	},
});
