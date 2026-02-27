import { CookieName } from "../constants/cookie.constants.js";
import { AuthenticationError, ValidationError } from "../errors/index.js";
import { cookieService } from "../services/cookie.service.js";
import { jwtService } from "../services/jwt.service.js";
import { sessionService } from "../services/session.service.js";
import { TokenType } from "../types/jwt.type.js";
import { asyncHandler } from "../utils/async-handler.util.js";

/**
 * Authenticate Middleware
 *
 * Verifies both refresh and access tokens are present and valid and sets the tokenId and userId in `res.locals`.
 *
 * This middleware must be used *before* any other middlewares that needs `res.locals.userId`.
 */
export const authenticate = asyncHandler(async (req, res, next) => {
	// Get and verify refresh token
	const getRefreshCookieResult = cookieService.get<string>({
		name: CookieName.REFRESH_TOKEN,
		request: req,
	});
	if (!getRefreshCookieResult.success) {
		return next(
			new AuthenticationError("Authentication required. Please sign in."),
		);
	}

	const verifyRefreshTokenResult = jwtService.verify({
		expectedType: TokenType.REFRESH,
		token: getRefreshCookieResult.data,
	});
	if (!verifyRefreshTokenResult.success) {
		return next(
			new AuthenticationError(
				"Session expired or invalid. Please sign in again.",
			),
		);
	}

	// Validate session
	const validateSessionResult = await sessionService.validate({
		tokenId: verifyRefreshTokenResult.data.tokenId,
		userId: verifyRefreshTokenResult.data.userId,
	});
	if (!validateSessionResult.success) {
		return next(
			new AuthenticationError(
				"Session expired or invalid. Please sign in again.",
			),
		);
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
	const isUserIdMatch =
		verifyAccessTokenResult.data.userId ===
		verifyRefreshTokenResult.data.userId;
	if (!isUserIdMatch) {
		return next(
			new ValidationError(
				"Token pair mismatch. Tokens belong to different users or sessions.",
			),
		);
	}

	// Set userId in res.locals
	res.locals.userId = verifyRefreshTokenResult.data.userId;

	next();
});
