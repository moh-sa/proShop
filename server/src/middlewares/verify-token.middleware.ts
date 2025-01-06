import { NextFunction, Request, Response } from "express";
import { handleErrorResponse, isExist, verifyJwtToken } from "../utils";

export function verifyTokenMW(req: Request, res: Response, next: NextFunction) {
  const authorization = req.headers.authorization;
  if (!isExist(authorization))
    return handleErrorResponse(res, 401, "Not authorized. No token.");
  if (!authorization.startsWith("Bearer "))
    return handleErrorResponse(res, 401, "Invalid token format.");

  // remove the 'Bearer ' prefix from the token
  const token = authorization.slice(7);

  try {
    const decoded = verifyJwtToken(token);
    res.locals.token = decoded;
    next();
  } catch (error) {
    res.status(401);
    throw new Error("Not authorized.");
  }
}
