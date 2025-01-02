import jwt from "jsonwebtoken";

export const generateToken = (data: Record<string, unknown>) => {
  return jwt.sign(data, process.env.JWT_SECRET!, { expiresIn: "30d" });
};
