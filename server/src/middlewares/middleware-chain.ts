import type { RequestHandler } from "express";

import { authenticate } from "./authenticate.middleware.js";
import { authorizeAdmin } from "./authorize-admin.middleware.js";

export function adminGuard(limiter: RequestHandler): Array<RequestHandler> {
	return [limiter, authenticate, authorizeAdmin];
}

export function userGuard(limiter: RequestHandler): Array<RequestHandler> {
	return [limiter, authenticate];
}
