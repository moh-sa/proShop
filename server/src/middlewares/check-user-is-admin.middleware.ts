import { NextFunction, Request, Response } from "express";

/**
 * Middleware to check admin privileges
 */
export async function checkIfUserIsAdmin(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  const user = res.locals.user;

  if (!user.isAdmin) {
    return res.status(401).json({ message: "Admin access required." });
  }

  return next();
}
