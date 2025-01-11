import { NextFunction, Request, Response } from "express";
import { verifyJwtToken } from "../utils";

/**
 * Middleware to validate JWT token
 */
export async function checkJwtTokenValidation(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  const authorization = req.headers.authorization;
  if (!authorization || !authorization.startsWith("Bearer "))
    return res
      .status(401)
      .json({ message: "Not authorized. No token provided." });

  // remove the `Bearer ` prefix from the token
  const token = authorization.slice(7);
  const decoded = verifyJwtToken(token);
  res.locals.token = decoded;
  next();
}
