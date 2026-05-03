import { ErrorPage, NotFoundPage } from "@/components/errors";
import { routeTree } from "@/routeTree.gen";
import type { QueryClient } from "@tanstack/react-query";
import { createRouter, Router } from "@tanstack/react-router";
import { queryClient } from "../query";

const router = createRouter({
	routeTree,
	scrollRestoration: true,
	context: {
		client: queryClient,
	},
	defaultPreload: "intent",
	defaultNotFoundComponent: NotFoundPage,
	defaultErrorComponent: ErrorPage,
});

/** Returns the same router instance */
export function getRouter(): Router<typeof routeTree> {
	return router;
}

export type RouterContext = {
	client: QueryClient;
};

// Register the router type with TanStack Router for proper type inference (e.g. links, useRouter, etc.).
declare module "@tanstack/react-router" {
	interface Register {
		router: typeof router;
	}
}
