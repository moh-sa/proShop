import { NextFunction, Request, Response } from "express";
import asyncHandler from "express-async-handler";
import User, { IUser } from "../models/userModel";
import { handleErrorResponse, isExist, verifyJwtToken } from "../utils";

const protect = asyncHandler(async (req, res, next) => {
  const customReq = req as typeof req & { user: IUser };
  const authorization = customReq.headers.authorization;
  if (!isExist(authorization) || !authorization.startsWith("Bearer "))
    return handleErrorResponse(res, 401, "Not authorized, no token.");

  const token = authorization.slice(7);

  try {
    const decoded = verifyJwtToken(token);

    const isUserExist = await User.findById(decoded.id).select("-password");
    if (!isExist(isUserExist))
      return handleErrorResponse(res, 401, "User not found");

    customReq.user = isUserExist;
    return next();
  } catch (error) {
    console.log(error);
    res.status(401);
    throw new Error("Not authorized, token failed.");
  }
});

const admin = (req: Request, res: Response, next: NextFunction) => {
  const customReq = req as typeof req & { user: IUser };
  if (customReq.user && customReq.user.isAdmin) {
    next();
  } else {
    res.status(401);
    throw new Error("Not Authorized as an admin.");
  }
};

export { admin, protect };
