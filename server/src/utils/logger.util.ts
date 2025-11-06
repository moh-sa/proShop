import pino from "pino";

import { loggerConfig } from "../config/index.js";
import { asyncContext } from "./async-context.util.js";

/**
 * Root logger instance.
 *
 * **When to use:**
 * - App startup/shutdown
 * - Middleware that init request-scoped context
 * - Code outside of request flow
 * @example
 * ```
 * logger.info({...}, "message");
 * ```
 */
export const logger = pino(loggerConfig);

/**
 * Gets the request-scoped logger from async context.
 *
 * **When to use:**
 * - In controllers, services, etc.
 * - Anywhere logs needs to include the `requestId`
 * @example
 * ```
 * const logger = getLogger().child({...});
 * logger.info({...}, "message");
 * ```
 */
export function getLoggerFromContext(): typeof logger {
	return asyncContext.getStore()?.logger ?? logger;
}
