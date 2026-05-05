import { RootLayout as RootLayoutComponent } from "@/components/layouts";
import { useAuth } from "@/features/auth";
import { AppProvider } from "@/providers/app.provider";
import type { RouterContext } from "@/shared/router";
import { createRootRouteWithContext } from "@tanstack/react-router";
import { TanStackRouterDevtools } from "@tanstack/react-router-devtools";

export const Route = createRootRouteWithContext<RouterContext>()({
	component: RootLayout,
});

function RootLayout() {
	useAuth();
	return (
		<AppProvider>
			<RootLayoutComponent />
			<TanStackRouterDevtools />
		</AppProvider>
	);
}
