import { NextFunction, Request, Response } from "express";
import User from "../models/userModel";

/**
 * Middleware to verify user existence by ID
 */
export async function checkUserIdExists(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  const userId = (res.locals.token?.id || res.locals.user?._id) as string; // TODO: fix later
  if (!userId) {
    return res.status(400).json({ message: "required field is missing." });
  }

  const user = await User.findById(userId);
  if (!user) {
    return res.status(400).json({ message: "Invalid email or password." });
  }

  res.locals.user = user;
  next();
}
