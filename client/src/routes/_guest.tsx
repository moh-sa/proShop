import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/_guest")({
	beforeLoad({ context }) {
		if (context.user) {
			throw redirect({ to: "/", replace: true });
		}
	},
	component: GuestLayout,
});

function GuestLayout() {
	return (
		<div className="mx-auto w-full max-w-sm">
			<Outlet />
		</div>
	);
}
