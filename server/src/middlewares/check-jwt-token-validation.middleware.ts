import { NextFunction, Request, Response } from "express";
import { formatZodErrors, verifyJwtToken } from "../utils";
import { authHeaderValidator } from "../validators";

/**
 * Middleware to validate JWT token
 */
export async function checkJwtTokenValidation(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  const authParsed = authHeaderValidator.safeParse(req.headers.authorization);
  if (!authParsed.success) {
    return res.status(401).json({
      message: formatZodErrors(authParsed.error),
    });
  }

  const decoded = verifyJwtToken(authParsed.data);
  res.locals.token = decoded;
  next();
}
