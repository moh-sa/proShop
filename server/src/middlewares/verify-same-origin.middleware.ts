import type { NextFunction, Request, Response } from "express";

import { env } from "../config/index.js";
import { ForbiddenError } from "../errors/index.js";

const SAFE_METHODS = new Set(["GET", "HEAD", "OPTIONS"]);

const APP_ORIGIN = new URL(env.APP_URL).origin;

/**
 * Verify Same Origin Middleware (CSRF protection)
 *
 * Blocks state-changing requests that a browser sent from another site.
 * `SameSite=Strict` already keeps the session cookie off cross-site requests;
 * this also covers sibling `*.moh-sa.dev` subdomains, which count as same-site.
 *
 * Browsers always send `Sec-Fetch-Site` (modern) or `Origin` (older) on these
 * requests, so a request with neither comes from a non-browser client.
 */
export function verifySameOrigin(
	req: Request,
	_res: Response,
	next: NextFunction,
) {
	if (SAFE_METHODS.has(req.method)) {
		return next();
	}

	const fetchSite = req.get("sec-fetch-site");
	if (fetchSite !== undefined) {
		return fetchSite === "same-origin" ? next() : next(crossSiteError());
	}

	const origin = req.get("origin");
	if (origin !== undefined && origin !== APP_ORIGIN) {
		return next(crossSiteError());
	}

	next();
}

function crossSiteError() {
	return new ForbiddenError("Cross-site request blocked");
}
