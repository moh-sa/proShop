import { asyncHandler } from "../utils";
import { passwordConfirmationValidator } from "../validators";

/**
 * Middleware to validate password
 */
export const checkPasswordValidation = asyncHandler(async (req, res, next) => {
  passwordConfirmationValidator.parse({
    request: req.body.password,
    encrypted: res.locals.user.password,
  });

  next();
});
