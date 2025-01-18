import { NextFunction, Request, Response } from "express";
import { formatZodErrors, verifyJwtToken } from "../utils";
import { authHeaderValidator, jwtValidator } from "../validators";

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

  const tokenParsed = jwtValidator.safeParse(authParsed.data);
  if (!tokenParsed.success) {
    return res.status(401).json({
      message: formatZodErrors(tokenParsed.error),
    });
  }

  const decoded = verifyJwtToken(tokenParsed.data);
  res.locals.token = decoded;
  next();
}
