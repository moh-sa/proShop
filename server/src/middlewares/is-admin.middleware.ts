import { NextFunction, Request, Response } from "express";
import { handleErrorResponse } from "../utils";

export function isUserAdminMW(req: Request, res: Response, next: NextFunction) {
  const user = res.locals.user;
  if (!user.isAdmin)
    return handleErrorResponse(res, 401, "Not authorized as an admin.");

  next();
}
