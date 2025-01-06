import { NextFunction, Request, Response } from "express";
import User from "../models/userModel";
import { handleErrorResponse } from "../utils";

export async function getUserByEmailMW(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const user = await User.findOne({ email: req.body.email });
    if (!user)
      return handleErrorResponse(res, 404, "Invalid email or password.");

    res.locals.user = user;
    next();
  } catch (error) {
    res.status(500);
    throw new Error("Internal server error.");
  }
}
