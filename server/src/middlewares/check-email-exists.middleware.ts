import { NextFunction, Request, Response } from "express";
import { userRepository } from "../repositories";
import { formatZodErrors } from "../utils";
import { emailValidator } from "../validators";

/**
 * Middleware to verify email existence
 * @param allowExisting - If true, allows existing email (for login)
 */
export function checkEmailExists(allowExisting = false) {
  return async (req: Request, res: Response, next: NextFunction) => {
    const emailParsed = emailValidator.safeParse(req.body.email);
    if (!emailParsed.success) {
      return res
        .status(400)
        .json({ message: formatZodErrors(emailParsed.error) });
    }

    const user = await userRepository.getUserByEmail({
      email: emailParsed.data,
    });

    if (user && !allowExisting) {
      return res
        .status(400)
        .json({ message: "An account with this email already exists." });
    }

    if (user && allowExisting) {
      res.locals.user = user;
    }

    next();
  };
}
