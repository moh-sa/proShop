import { CookieName } from "../constants/cookie.constants.js";
import { AuthenticationError } from "../errors/index.js";
import { cookieService } from "../services/cookie.service.js";
import { jwtService } from "../services/jwt.service.js";
import { sessionService } from "../services/session.service.js";
import { TokenType } from "../types/jwt.type.js";
import { asyncHandler } from "../utils/async-handler.util.js";

/**
 * Refresh Session Authentication Middleware
 *
 * Verifies that the refresh token and session are valid and sets `res.locals.userId`.
 *
 * This middleware must be used *before* any other middlewares that needs `res.locals.userId`.
 */
export const authenticateRefreshSession = asyncHandler(
	async (req, res, next) => {
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

		// Set userId in res.locals
		res.locals.userId = verifyRefreshTokenResult.data.userId;

		next();
	},
);
