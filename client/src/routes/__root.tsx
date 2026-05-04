import { RootLayout as RootLayoutComponent } from "@/components/layouts";
import { AppProvider } from "@/providers/app.provider";
import type { RouterContext } from "@/shared/router";
import { createRootRouteWithContext } from "@tanstack/react-router";
import { TanStackRouterDevtools } from "@tanstack/react-router-devtools";

export const Route = createRootRouteWithContext<RouterContext>()({
	component: RootLayout,
});

function RootLayout() {
	return (
		<AppProvider>
			<RootLayoutComponent />
			<TanStackRouterDevtools />
		</AppProvider>
	);
}
