import { asyncContext } from "../utils/async-context.util.js";
import { asyncHandler } from "../utils/async-handler.util.js";
import { logger } from "../utils/logger.util.js";

/**
 * Middleware that attaches a request-scoped logger to the async context.
 *
 * Must run *after* `requestId` middleware.
 */
export const addLoggerToContext = asyncHandler(async (req, _res, next) => {
	asyncContext.run(
		{
			logger: logger.child({ requestId: req.id.toString() }),
		},
		next,
	);
});
