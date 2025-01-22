import { userService } from "../services";
import { asyncHandler } from "../utils";
import { emailValidator } from "../validators";

/**
 * Middleware to verify email existence
 * @param allowExisting - If true, allows existing email (for login)
 */
export const checkEmailExists = (allowExisting = false) =>
  asyncHandler(async (req, res, next) => {
    const email = emailValidator.parse(req.body.email);

    const user = await userService.getByEmail({ email });

    if (user && !allowExisting) {
      return res
        .status(400)
        .json({ message: "An account with this email already exists." });
    }

    if (user && allowExisting) {
      res.locals.user = user;
    }

    next();
  });
