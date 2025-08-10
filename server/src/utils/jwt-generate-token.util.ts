import jwt from "jsonwebtoken";

import { env } from "../config/env.js";
import { jwtSignOptions } from "../config/jwt.config.js";

export const generateJwtToken = (
  payload: Record<string, unknown> = {},
  options: jwt.SignOptions = jwtSignOptions,
): string => {
  return jwt.sign(payload, env.JWT_SECRET, options);
};
