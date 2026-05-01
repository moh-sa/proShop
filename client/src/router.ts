import { queryClient } from "@/lib";
import type { QueryClient } from "@tanstack/react-query";
import { createRouter, Router } from "@tanstack/react-router";
import { ErrorPage, NotFoundPage } from "./components/errors";
import { routeTree } from "./routeTree.gen";

export type RouterContext = {
	client: QueryClient;
};

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

declare module "@tanstack/react-router" {
	interface Register {
		router: typeof router;
	}
}

export default function getRouter(): Router<typeof routeTree> {
	return router;
}
