import { CookieName } from "../constants/cookie.constants.js";
import {
	AuthenticationError,
	InternalError,
	ValidationError,
} from "../errors/index.js";
import { cookieService } from "../services/cookie.service.js";
import { jwtService } from "../services/jwt.service.js";
import { TokenType } from "../types/jwt.type.js";
import { asyncHandler } from "../utils/async-handler.util.js";

/**
 * Access Token Authentication Middleware
 *
 * Verifies that the access token is present, valid, and belongs to the same
 * user identified by the refresh-session middleware.
 *
 * This middleware must be used *after* `authenticateRefreshSession`.
 */
export const authenticateAccessToken = asyncHandler(async (req, res, next) => {
	const userId = res.locals.userId;
	if (!userId) {
		return next(new InternalError("User ID not found in res.locals."));
	}

	// Get and verify access token
	const getAccessCookieResult = cookieService.get<string>({
		name: CookieName.ACCESS_TOKEN,
		request: req,
	});
	if (!getAccessCookieResult.success) {
		return next(
			new AuthenticationError(
				"Access token missing. Please call POST /auth/refresh to obtain a new token.",
			),
		);
	}

	const verifyAccessTokenResult = jwtService.verify({
		expectedType: TokenType.ACCESS,
		token: getAccessCookieResult.data,
	});
	if (!verifyAccessTokenResult.success) {
		return next(
			new AuthenticationError(
				"Access token expired or invalid. Please call POST /auth/refresh to obtain a new token.",
			),
		);
	}

	// Validate token pairing
	const isUserIdMatch = verifyAccessTokenResult.data.userId === userId;
	if (!isUserIdMatch) {
		return next(
			new ValidationError(
				"Token pair mismatch. Tokens belong to different users or sessions.",
			),
		);
	}

	next();
});
