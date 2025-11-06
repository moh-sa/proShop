import pino from "pino";

import { loggerConfig } from "../config/index.js";

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
