import type { RequestHandler } from "express";

import { authenticateAccessToken } from "./authenticate-access-token.middleware.js";
import { authenticateRefreshSession } from "./authenticate-refresh-session.middleware.js";
import { authorizeAdmin } from "./authorize-admin.middleware.js";
import { checkUserExists } from "./check-user-exists.middleware.js";

export function adminGuard(limiter: RequestHandler): Array<RequestHandler> {
	return [
		limiter,
		authenticateRefreshSession,
		authenticateAccessToken,
		checkUserExists,
		authorizeAdmin,
	];
}

export function refreshGuard(limiter: RequestHandler): Array<RequestHandler> {
	return [limiter, authenticateRefreshSession, checkUserExists];
}

export function userGuard(limiter: RequestHandler): Array<RequestHandler> {
	return [
		limiter,
		authenticateRefreshSession,
		authenticateAccessToken,
		checkUserExists,
	];
}
