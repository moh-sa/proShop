import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated")({
	beforeLoad({ context }) {
		if (!context.user) {
			throw redirect({ to: "/signin", replace: true });
		}

		return { user: context.user };
	},
	component: Outlet,
});
