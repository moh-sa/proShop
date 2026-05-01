import { RootLayout as RootLayoutComponent } from "@/components/layouts";
import type { RouterContext } from "@/router";
import { createRootRouteWithContext } from "@tanstack/react-router";
import { TanStackRouterDevtools } from "@tanstack/react-router-devtools";

export const Route = createRootRouteWithContext<RouterContext>()({
	component: RootLayout,
});

function RootLayout() {
	return (
		<>
			<RootLayoutComponent />
			<TanStackRouterDevtools />
		</>
	);
}
