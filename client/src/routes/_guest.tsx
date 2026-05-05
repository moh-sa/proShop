import { authKeys } from "@/features/auth";
import type { User } from "@/features/users";
import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/_guest")({
	beforeLoad({ context }) {
		const cachedUser = context.client.getQueryData<User>(authKeys.me());

		if (cachedUser) {
			throw redirect({ to: "/", replace: true });
		}
	},
	component: Outlet,
});
