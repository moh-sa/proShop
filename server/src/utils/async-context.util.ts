import { AsyncLocalStorage } from "node:async_hooks";

import type { Logger } from "pino";

interface AsyncContext {
	logger: Logger;
}

/**
 * AsyncLocalStorage instance for storing request-scoped data.
 *
 * This should only be used in middlewares.
 * @example
 * ```
 * // in middleware
 * asyncContext.run(
 *   { logger: logger.child({...}) },
 *   () => next(),
 * );
 * ```
 */
export const asyncContext = new AsyncLocalStorage<AsyncContext>();
