import type { SignOptions } from "jsonwebtoken";

import type { JwtConfig } from "../types/index.js";

import { env } from "./env.js";

/** @deprecated*/
export const jwtSignOptions: SignOptions = {
	expiresIn: "30d",
};

export const DEFAULT_JWT_CONFIG: JwtConfig = {
	accessTokenExpiresIn: 15 * 60, // 15 minutes
	accessTokenSecret: env.JWT_ACCESS_TOKEN_SECRET,
	refreshTokenExpiresIn: 30 * 24 * 60 * 60, // 30 days
	refreshTokenSecret: env.JWT_REFRESH_TOKEN_SECRET,
};
