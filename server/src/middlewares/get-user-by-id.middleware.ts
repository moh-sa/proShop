import { NextFunction, Request, Response } from "express";
import User from "../models/userModel";
import { handleErrorResponse, isExist } from "../utils";

export async function getUserByIdMW(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  const token = res.locals.token;
  try {
    // TODO: create a service that handles all user-related operations
    const userData = await User.findById(token.id);
    if (!isExist(userData))
      return handleErrorResponse(res, 404, "User not found.");

    res.locals.user = userData;
    next();
  } catch (error) {
    res.status(500);
    throw new Error("Internal server error.");
  }
}
