import * as Sentry from "@sentry/node";

import { env } from "./env.js";

Sentry.init({
	dsn: env.SENTRY_DNS,
	environment: env.NODE_ENV,
});
