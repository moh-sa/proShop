import * as Sentry from "@sentry/react";
import type { Router } from "@tanstack/react-router";
import { env } from "./env";
import type { routeTree } from "./routeTree.gen";

/**
 * Initialize Sentry. Must be called after router creation and before render.
 */
export function initSentry(router: Router<typeof routeTree>): void {
	Sentry.init({
		dsn: env.SENTRY_DSN,
		environment: env.MODE,

		sendDefaultPii: true,

		integrations: [
			Sentry.tanstackRouterBrowserTracingIntegration(router),
			Sentry.replayIntegration({
				maskAllText: true,
				blockAllMedia: true,
			}),
		],

		tracesSampleRate: env.DEV ? 1.0 : 0.2,
		tracePropagationTargets: ["localhost", /^https:\/\/.*/],

		replaysSessionSampleRate: 0.1,
		replaysOnErrorSampleRate: 1.0,
	});
}
