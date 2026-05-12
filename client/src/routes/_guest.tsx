import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/_guest")({
	beforeLoad({ context }) {
		if (context.user) {
			throw redirect({ to: "/", replace: true });
		}
	},
	component: Outlet,
});
