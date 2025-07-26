import { AuthenticationError } from "../errors";
import { UserRepository } from "../repositories";
import { asyncHandler } from "../utils";

const userRepository = new UserRepository();

/**
 * Middleware to verify user existence by ID
 */
export const checkUserIdExists = asyncHandler(async (req, res, next) => {
  const userId = res.locals.token._id;
  const user = await userRepository.getById({ userId });
  if (!user) throw new AuthenticationError();

  res.locals.user = user;

  next();
});
