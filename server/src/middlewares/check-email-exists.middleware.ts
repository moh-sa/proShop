import { NextFunction, Request, Response } from "express";
import { userRepository } from "../repositories";

/**
 * Middleware to verify email existence
 * @param allowExisting - If true, allows existing email (for login)
 */
export function checkEmailExists(allowExisting = false) {
  return async (req: Request, res: Response, next: NextFunction) => {
    const email = req.body.email;
    if (!email) {
      res.status(400).json({ message: "required field is missing." });
    }

    const user = await userRepository.getUserByEmail({ email });

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
