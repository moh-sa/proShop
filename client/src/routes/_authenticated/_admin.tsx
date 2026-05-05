import { authKeys } from "@/features/auth";
import type { User } from "@/features/users";
import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/_admin")({
	beforeLoad({ context }) {
		const cachedUser = context.client.getQueryData<User>(authKeys.me());

		// '_authenticated' route guarantees that the user is authenticated before call reaches this route
		if (!cachedUser!.isAdmin) {
			throw redirect({ to: "/unauthorized", replace: true });
		}
	},
	component: Outlet,
});
