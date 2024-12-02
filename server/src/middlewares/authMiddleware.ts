import asyncHandler from "express-async-handler";
import jwt from "jsonwebtoken";
import User from "../models/userModel";

const protect = asyncHandler(async (req, res, next) => {
  const token = req.headers.authorization;
  if (token && token.startsWith("Bearer ")) {
    try {
      const decoded = jwt.verify(token.split(" ")[1], process.env.JWT_SECRET);
      req.user = await User.findById(decoded.id).select("-password");
      next();
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

const admin = (req, res, next) => {
  if (req.user && req.user.isAdmin) {
    next();
  } else {
    res.status(401);
    throw new Error("Not Authorized as an admin.");
  }
};

export { protect, admin };
