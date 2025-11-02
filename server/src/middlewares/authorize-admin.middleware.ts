import { ForbiddenError, InternalError } from "../errors/index.js";
import { asyncHandler } from "../utils/async-handler.util.js";

/**
 * Authorize Admin Middleware
 *
 * Verifies that the user is an admin.
 *
 * This middleware must be used *after* `verifyUserExist` middleware.
 */
export const authorizeAdmin = asyncHandler(async (_req, res, next) => {
	// get user from res.locals
	const user = res.locals.user;
	if (!user) {
		return next(new InternalError("User not found in res.locals."));
	}

	// check if user is admin
	if (user.isAdmin !== true) {
		return next(
			new ForbiddenError("You do not have permission to access this resource."),
		);
	}

	next();
});
