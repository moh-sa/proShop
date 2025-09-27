import { AuthorizationError } from "../errors/index.js";
import { strictAsyncHandler } from "../utils/index.js";

/**
 * Middleware to check admin privileges
 */
export const checkIfUserIsAdmin = strictAsyncHandler(async (req, res, next) => {
	const user = res.locals.user;

	if (!user.isAdmin) {
		throw new AuthorizationError("Admin access required.");
	}

	next();
});
