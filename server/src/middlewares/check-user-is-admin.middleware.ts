import { AuthorizationError } from "../errors/index.js";
import { asyncHandler } from "../utils/index.js";

/**
 * Middleware to check admin privileges
 */
export const checkIfUserIsAdmin = asyncHandler(async (req, res, next) => {
	const user = res.locals.user;

	if (!user.isAdmin) {
		throw new AuthorizationError("Admin access required.");
	}

	next();
});
