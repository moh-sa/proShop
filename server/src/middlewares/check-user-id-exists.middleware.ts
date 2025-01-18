import { NextFunction, Request, Response } from "express";
import { userRepository } from "../repositories";

/**
 * Middleware to verify user existence by ID
 */
export async function checkUserIdExists(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  const userId = res.locals.token.id;
  const user = await userRepository.getUserById({ userId });
  if (!user) {
    return res.status(400).json({ message: "Invalid email or password." });
  }

  res.locals.user = user;

  next();
}
