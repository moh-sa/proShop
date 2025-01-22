import { AuthenticationError } from "../errors";
import { userRepository } from "../repositories";
import { asyncHandler } from "../utils";

/**
 * Middleware to verify user existence by ID
 */
export const checkUserIdExists = asyncHandler(async (req, res, next) => {
  const userId = res.locals.token.id;
  const user = await userRepository.getUserById({ userId });
  if (!user) throw new AuthenticationError("User");

  res.locals.user = user;

  next();
});
