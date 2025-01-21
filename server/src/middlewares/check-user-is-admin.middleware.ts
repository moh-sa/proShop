import { asyncHandler } from "../utils";

/**
 * Middleware to check admin privileges
 */
export const checkIfUserIsAdmin = asyncHandler(async (req, res, next) => {
  const user = res.locals.user;

  if (!user.isAdmin) {
    return res.status(401).json({ message: "Admin access required." });
  }

  return next();
});
