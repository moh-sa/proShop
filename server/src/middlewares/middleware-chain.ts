import type { RequestHandler } from "express";

import { authenticate } from "./authenticate.middleware.js";
import { authorizeAdmin } from "./authorize-admin.middleware.js";
import { checkUserExists } from "./check-user-exists.middleware.js";

export function adminGuard(limiter: RequestHandler): Array<RequestHandler> {
	return [limiter, authenticate, checkUserExists, authorizeAdmin];
}

export function refreshGuard(limiter: RequestHandler): Array<RequestHandler> {
	return [limiter, authenticate, checkUserExists];
}

export function userGuard(limiter: RequestHandler): Array<RequestHandler> {
	return [limiter, authenticate, checkUserExists];
}
