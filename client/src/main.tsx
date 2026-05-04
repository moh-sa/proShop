import * as Sentry from "@sentry/react";
import { RouterProvider } from "@tanstack/react-router";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { initSentry } from "./instrument.ts";
import QueryProvider from "./shared/query/provider.tsx";
import { getRouter } from "./shared/router/router.ts";

const router = getRouter();
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
