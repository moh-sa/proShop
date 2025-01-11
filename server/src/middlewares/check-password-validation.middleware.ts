import { NextFunction, Request, Response } from "express";
import { isPasswordValid } from "../utils";

/**
 * Middleware to validate password
 */
export async function checkPasswordValidation(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  const user = res.locals.user;
  const enteredPassword = req.body.password;
  const databasePassword = res.locals.user?.password;

  if (!user || !enteredPassword || !databasePassword) {
    return res.status(400).json({ message: "Invalid email or password." });
  }

  const isValid = await isPasswordValid(enteredPassword, databasePassword);
  if (!isValid) {
    return res.status(400).json({ message: "Invalid email or password." });
  }

  next();
}
