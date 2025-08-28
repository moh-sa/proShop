import * as Sentry from "@sentry/node";
import { nodeProfilingIntegration } from "@sentry/profiling-node";

import { env } from "./env.js";

Sentry.init({
	dsn: env.SENTRY_DNS,
	integrations: (integrations) => [
		nodeProfilingIntegration(),
		...integrations.filter((integration) => integration.name !== "Mongoose"),
	],
	profilesSampleRate: 1.0,
	tracesSampleRate: 1.0,
});
