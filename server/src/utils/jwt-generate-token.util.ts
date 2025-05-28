import jwt from "jsonwebtoken";
import { env } from "../config/env";
import { jwtSignOptions } from "../config/jwt.config";

export const generateJwtToken = (
  payload: Record<string, unknown> = {},
  options: jwt.SignOptions = jwtSignOptions,
): string => {
  return jwt.sign(payload, env.JWT_SECRET, options);
};
