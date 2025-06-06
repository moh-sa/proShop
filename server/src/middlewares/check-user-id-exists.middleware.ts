import { AuthenticationError } from "../errors";
import { userRepository } from "../repositories";
import { asyncHandler } from "../utils";

/**
 * Middleware to verify user existence by ID
 */
export const checkUserIdExists = asyncHandler(async (req, res, next) => {
  const userId = res.locals.token.id;
  const user = await userRepository.getById({ userId });
  if (!user) throw new AuthenticationError();

  res.locals.user = user;

  next();
});
