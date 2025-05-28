import jwt from "jsonwebtoken";
import { env } from "../config/env";

export const generateJwtToken = (
  payload: Record<string, unknown> = {},
): string => {
  return jwt.sign(payload, env.JWT_SECRET, { expiresIn: "30d" });
};
