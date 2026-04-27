import { createRouter, Router } from "@tanstack/react-router";
import { ErrorPage } from "./components/errors";
import { queryClient } from "./providers/query.provider";
import { routeTree } from "./routeTree.gen";

const router = createRouter({
  routeTree,
  scrollRestoration: true,
  context: {
    client: queryClient,
  },
  defaultPreload: "intent",
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
