import { ConflictError } from "../errors";
import { userRepository } from "../repositories";
import { asyncHandler } from "../utils";
import { emailValidator } from "../validators";

/**
 * Middleware to verify email existence
 * @param allowExisting - If true, allows existing email (for login)
 */
export const checkEmailExists = (allowExisting = false) =>
  asyncHandler(async (req, res, next) => {
    const email = emailValidator.parse(req.body.email);

    const user = await userRepository.getByEmail({ email });

    if (user && !allowExisting) {
      throw new ConflictError("An account with this email already exists.");
    }

    if (user && allowExisting) {
      res.locals.user = user;
    }

    next();
  });
