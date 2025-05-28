import jwt from "jsonwebtoken";
import { env } from "../config/env";

export const generateToken = (data: Record<string, unknown>) => {
  return jwt.sign(data, env.JWT_SECRET, { expiresIn: "30d" });
};
