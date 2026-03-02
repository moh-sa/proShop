import * as Sentry from "@sentry/react";
import { createRouter, RouterProvider } from "@tanstack/react-router";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { initSentry } from "./instrument.ts";
import QueryProvider, { queryClient } from "./providers/query.provider.tsx";
import { routeTree } from "./routeTree.gen.ts";

const router = createRouter({
  routeTree,
  scrollRestoration: true,
  context: {
    client: queryClient,
  },
  defaultPreload: "intent",
});

initSentry(router);

createRoot(document.getElementById("root")!, {
  onUncaughtError: Sentry.reactErrorHandler(),
  onCaughtError: Sentry.reactErrorHandler(),
  onRecoverableError: Sentry.reactErrorHandler(),
}).render(
  <StrictMode>
    <QueryProvider>
      <RouterProvider router={router} />
    </QueryProvider>
  </StrictMode>,
);
