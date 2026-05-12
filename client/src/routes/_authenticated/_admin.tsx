import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/_admin")({
	beforeLoad({ context }) {
		// '_authenticated' route guarantees that the user is authenticated before call reaches this route
		if (!context.user.isAdmin) {
			throw redirect({ to: "/unauthorized", replace: true });
		}
	},
	component: Outlet,
});
