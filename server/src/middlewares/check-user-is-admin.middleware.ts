import { AuthorizationError } from "../errors";
import { asyncHandler } from "../utils";

/**
 * Middleware to check admin privileges
 */
export const checkIfUserIsAdmin = asyncHandler(async (req, res, next) => {
  const user = res.locals.user;

  if (!user.isAdmin) {
    throw new AuthorizationError("Admin access required.");
  }

  return next();
});
