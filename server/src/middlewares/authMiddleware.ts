import { NextFunction, Request, Response } from "express";
import asyncHandler from "express-async-handler";
import jwt from "jsonwebtoken";
import User, { IUser } from "../models/userModel";

const protect = asyncHandler(async (req, res, next) => {
  const customReq = req as typeof req & { user: IUser };
  const token = customReq.headers.authorization;
  if (token && token.startsWith("Bearer ")) {
    try {
      const decoded = jwt.verify(
        token.split(" ")[1],
        process.env.JWT_SECRET!,
      ) as {
        id: string;
      };

      const isUserExist = await User.findById(decoded.id).select("-password");
      if (isUserExist) {
        customReq.user = isUserExist;
        next();
      }

      throw new Error("Not authorized, token failed.");
    } catch (error) {
      console.log(error);
      res.status(401);
      throw new Error("Not authorized, token failed.");
    }
  } else {
    res.status(401);
    throw new Error("Not authorized, no token.");
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
