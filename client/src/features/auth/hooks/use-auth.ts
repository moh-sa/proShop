import { useQuery } from "@tanstack/react-query";
import { getMeQueryOptions } from "../query/queries";

export function useAuth() {
	const query = useQuery(getMeQueryOptions);
	const user = query.data;
	const isAuthenticated = Boolean(user);
	const isAdmin = user?.isAdmin ?? false;

	return {
		user,
		isAuthenticated,
		isAdmin,
		isLoading: query.isPending,
	};
}
