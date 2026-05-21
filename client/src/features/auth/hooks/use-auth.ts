import type { User } from "@/features/users";
import { useQuery } from "@tanstack/react-query";
import { getMeQueryOptions } from "../query/queries";

type AuthenticatedState = {
	isAuthenticated: true;
	user: User;
	isAdmin: boolean;
	isLoading: boolean;
};

type UnauthenticatedState = {
	isAuthenticated: false;
	user: undefined;
	isAdmin: false;
	isLoading: boolean;
};

type AuthState = AuthenticatedState | UnauthenticatedState;

export function useAuth(): AuthState {
	const query = useQuery(getMeQueryOptions);
	const user = query.data;

	if (user) {
		return {
			isAuthenticated: true,
			user,
			isAdmin: user.isAdmin,
			isLoading: query.isPending,
		};
	}

	return {
		isAuthenticated: false,
		user: undefined,
		isAdmin: false,
		isLoading: query.isPending,
	};
}
