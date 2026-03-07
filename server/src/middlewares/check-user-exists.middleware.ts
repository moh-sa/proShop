import { InternalError } from "../errors/index.js";
import { userService } from "../services/user.service.js";
import { asyncHandler } from "../utils/async-handler.util.js";

/**
 * Check User Exists Middleware
 *
 * Checks that the user exists in the database and sets it in `res.locals.user`.
 *
 * This middleware must be used *after* `authenticateRefreshSession` and *before* other middlewares that needs `res.locals.user`.
 */
export const checkUserExists = asyncHandler(async (_req, res, next) => {
	// Get userId from res.locals
	const userId = res.locals.userId;
	if (!userId) {
		return next(new InternalError("User ID not found in res.locals."));
	}

	// Verify user exists in database
	const getUserByIdResult = await userService.getById({ userId });
	if (!getUserByIdResult.success) {
		return next(getUserByIdResult.error);
	}

	// Set user in res.locals
	// eslint-disable-next-line require-atomic-updates -- false warning
	res.locals.user = getUserByIdResult.data;

	next();
});
