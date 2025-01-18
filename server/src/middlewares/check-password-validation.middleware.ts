import { NextFunction, Request, Response } from "express";
import { formatZodErrors } from "../utils";
import { passwordConfirmationValidator } from "../validators";

/**
 * Middleware to validate password
 */
export async function checkPasswordValidation(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  const passwordConfirmationParsed = passwordConfirmationValidator.safeParse({
    request: req.body.password,
    encrypted: res.locals.user.password,
  });

  if (!passwordConfirmationParsed.success) {
    return res.status(400).json({
      message: formatZodErrors(passwordConfirmationParsed.error),
    });
  }

  next();
}
