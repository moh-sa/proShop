import { RootLayout as RootLayoutComponent } from "@/components/layouts";
import { createRootRouteWithContext } from "@tanstack/react-router";
import { TanStackRouterDevtools } from "@tanstack/react-router-devtools";
import type { RouterContext } from "../types/router-context.type";

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
