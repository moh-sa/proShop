import type { Request, Response } from "express";

import type { IAuthManager } from "../managers/index.js";
import type { ICookieService } from "../services/index.js";
import type {
	AsyncHandler,
	InsertUser,
	PaginatedResponse,
	PaginationParamsString,
	SafeSelectUser,
	SelectSession,
	TokenPair,
} from "../types/index.js";

import { CookieName, HTTP_STATUS } from "../constants/index.js";
import { AuthManager } from "../managers/index.js";
import { CookieService } from "../services/index.js";
import { asyncHandler, getLoggerFromContext } from "../utils/index.js";
import { jwtTokenValidator } from "../validators/index.js";

/**
 * Authentication Controller (v2) Interface
 * @remarks The v1 Auth controller is being deprecated soon.
 */
export interface IAuth2Controller {
	// User Registration & Authentication
	/**
	 * POST /auth/signup
	 */
	signUp: AsyncHandler<{
		reqBody: InsertUser;
		resBody: { data: { user: SafeSelectUser } };
	}>;

	/**
	 * POST /auth/signin
	 */
	signIn: AsyncHandler<{
		reqBody: Pick<InsertUser, "email" | "password">;
		resBody: { data: { user: SafeSelectUser } };
	}>;

	/**
	 * DELETE /auth/signout/current
	 */
	signOut: AsyncHandler<{ resBody: { data: { message: string } } }>;

	/**
	 * DELETE /auth/signout
	 */
	signOutAll: AsyncHandler<{
		resBody: {
			data: { message: string };
			meta: { removedCount: number };
		};
	}>;

	// Token Management
	/**
	 * POST /auth/token/refresh
	 */
	refreshAccessToken: AsyncHandler<{
		resBody: { data: { message: string } };
	}>;

	// Session Management
	/**
	 * GET /auth/sessions
	 */
	getUserSessions: AsyncHandler<{
		query: PaginationParamsString;
		resBody: {
			data: PaginatedResponse<SelectSession>["items"];
			meta: PaginatedResponse<SelectSession>["meta"];
		};
	}>;

	/**
	 * DELETE /auth/sessions/current
	 */
	revokeSession: AsyncHandler<{ resBody: { data: { message: string } } }>;

	/**
	 * DELETE /auth/sessions
	 */
	revokeAllSessions: AsyncHandler<{
		resBody: { data: { message: string }; meta: { revokedCount: number } };
	}>;
}

/**
 * Authentication Controller (v2)
 * @remarks The v1 Auth controller is being deprecated soon.
 */
export class Auth2Controller implements IAuth2Controller {
	private readonly _authManager: IAuthManager;

	private readonly _cookieService: ICookieService;

	constructor(authManager?: IAuthManager, cookieService?: ICookieService) {
		this._authManager = authManager ?? new AuthManager();
		this._cookieService = cookieService ?? new CookieService();
	}

	/**
	 * POST /auth/signin
	 */
	signIn = asyncHandler<{
		reqBody: Pick<InsertUser, "email" | "password">;
		resBody: { data: { user: SafeSelectUser } };
	}>(async (req, res) => {
		const logger = this._getLogger({ method: "signIn" });
		logger.debug({ args: req.body }, "Signing in user");

		// Create a session
		const result = await this._authManager.signIn(req.body);
		if (!result.success) {
			throw result.error;
		}

		logger.debug({ result: result.data }, "User signed in");

		// Set access and refresh tokens in cookies
		this._setAuthCookies(result.data.tokens, res);
		logger.debug("Set access and refresh tokens in cookies successfully");

		logger.info(
			{ userId: result.data.user._id },
			"User signed in successfully",
		);

		res.status(HTTP_STATUS.OK).json({
			data: {
				user: result.data.user,
			},
			success: true,
		});
	});

	/**
	 * POST /auth/signup
	 */
	signUp = asyncHandler<{
		reqBody: InsertUser;
		resBody: { data: { user: SafeSelectUser } };
	}>(async (req, res) => {
		const logger = this._getLogger({ method: "signUp" });
		logger.debug({ args: req.body }, "Signing up user");

		// Create a session
		const result = await this._authManager.signUp(req.body);
		if (!result.success) {
			throw result.error;
		}

		logger.debug({ result: result.data }, "User signed up");

		// Set access and refresh tokens in cookies
		this._setAuthCookies(result.data.tokens, res);
		logger.debug("Set access and refresh tokens in cookies successfully");

		logger.info(
			{ userId: result.data.user._id },
			"User signed up successfully",
		);

		res.status(HTTP_STATUS.CREATED).json({
			data: {
				user: result.data.user,
			},
			success: true,
		});
	});

	/**
	 * DELETE /auth/signout/current
	 */
	signOut = asyncHandler<{ resBody: { data: { message: string } } }>(
		async (req, res) => {
			const logger = this._getLogger({ method: "signOut" });
			logger.debug({ args: req.body }, "Signing out current session");

			// Get refresh token from cookie
			const refreshCookie = this._getRefreshTokenFromCookie(req);
			logger.debug({ refreshCookie }, "Got refresh token from cookie");

			// Delete the session
			const result = await this._authManager.signOut({
				refreshToken: refreshCookie,
			});
			if (!result.success) {
				throw result.error;
			}
			logger.debug({ result: result.data }, "Session signed out");

			// Clear the access and refresh tokens cookies
			this._clearAuthCookies(res);
			logger.debug("Cleared access and refresh tokens cookies successfully");

			logger.info("User signed out successfully");

			res.status(HTTP_STATUS.OK).json({
				data: {
					message: "Logged out successfully",
				},
				success: true,
			});
		},
	);

	/**
	 * DELETE /auth/signout
	 */
	signOutAll = asyncHandler<{
		resBody: {
			data: { message: string };
			meta: { removedCount: number };
		};
	}>(async (req, res) => {
		const logger = this._getLogger({ method: "signOutAll" });
		logger.debug("Signing out all sessions");

		// Get refresh token from cookie
		const refreshCookie = this._getRefreshTokenFromCookie(req);
		logger.debug({ refreshCookie }, "Got refresh token from cookie");

		// Delete all sessions
		const result = await this._authManager.signOutAll({
			refreshToken: refreshCookie,
		});
		if (!result.success) {
			throw result.error;
		}
		logger.debug({ result: result.data }, "All sessions signed out");

		// Clear the access and refresh tokens cookies
		this._clearAuthCookies(res);
		logger.debug("Cleared access and refresh tokens cookies successfully");

		logger.info(
			{ removedCount: result.data },
			"User signed out from all devices successfully",
		);

		res.status(HTTP_STATUS.OK).json({
			data: {
				message: "Logged out from all devices",
			},
			meta: {
				removedCount: result.data,
			},
			success: true,
		});
	});

	/**
	 * POST /auth/token/refresh
	 */
	refreshAccessToken = asyncHandler<{
		resBody: { data: { message: string } };
	}>(async (req, res) => {
		const logger = this._getLogger({ method: "refreshAccessToken" });
		logger.debug("Refreshing access token");

		// Get refresh token from cookie
		const refreshCookie = this._getRefreshTokenFromCookie(req);
		logger.debug({ refreshCookie }, "Got refresh token from cookie");

		// Refresh access token
		const accessTokenResult = await this._authManager.refreshAccessToken({
			refreshToken: refreshCookie,
		});
		if (!accessTokenResult.success) {
			throw accessTokenResult.error;
		}
		logger.debug({ result: accessTokenResult.data }, "Access token refreshed");

		// Set the new access token in the cookie
		this._setAccessTokenCookie({
			expiresAt: accessTokenResult.data.expiresAt,
			res,
			token: accessTokenResult.data.token,
		});
		logger.debug("Set access token in cookie successfully");

		logger.info("Access token refreshed successfully");

		res.status(HTTP_STATUS.OK).json({
			data: {
				message: "Access token refreshed successfully",
			},
			success: true,
		});
	});

	/**
	 * GET /auth/sessions
	 */
	getUserSessions = asyncHandler<{
		query: PaginationParamsString;
		resBody: {
			data: PaginatedResponse<SelectSession>["items"];
			meta: PaginatedResponse<SelectSession>["meta"];
		};
	}>(async (req, res) => {
		const logger = this._getLogger({ method: "getUserSessions" });
		logger.debug({ query: req.query }, "Getting user sessions");

		// Get refresh token from cookie
		const refreshCookie = this._getRefreshTokenFromCookie(req);
		logger.debug({ refreshCookie }, "Got refresh token from cookie");

		// Get user sessions
		const result = await this._authManager.getUserSessions({
			pageNumber: req.query.pageNumber,
			pageSize: req.query.pageSize,
			refreshToken: refreshCookie,
			sort: req.query.sort,
		});
		if (!result.success) {
			throw result.error;
		}

		logger.info(
			{ sessionCount: result.data.items.length },
			"User sessions retrieved successfully",
		);

		res.status(HTTP_STATUS.OK).json({
			data: result.data.items,
			meta: result.data.meta,
			success: true,
		});
	});

	/**
	 * DELETE /auth/sessions/current
	 */
	revokeSession = asyncHandler<{
		resBody: { data: { message: string } };
	}>(async (req, res) => {
		const logger = this._getLogger({ method: "revokeSession" });
		logger.debug("Revoking current session");

		// Get refresh token from cookie
		const refreshCookie = this._getRefreshTokenFromCookie(req);
		logger.debug({ refreshCookie }, "Got refresh token from cookie");

		// Revoke session
		const result = await this._authManager.revokeSession({
			refreshToken: refreshCookie,
		});
		if (!result.success) {
			throw result.error;
		}
		logger.debug({ result: result.data }, "Session revoked");

		// Clear the access and refresh tokens cookies
		this._clearAuthCookies(res);
		logger.debug("Cleared access and refresh tokens cookies successfully");

		logger.info("Session revoked successfully");

		res.status(HTTP_STATUS.OK).json({
			data: {
				message: "Session revoked successfully",
			},
			success: true,
		});
	});

	/**
	 * DELETE /auth/sessions
	 */
	revokeAllSessions = asyncHandler<{
		resBody: { data: { message: string }; meta: { revokedCount: number } };
	}>(async (req, res) => {
		const logger = this._getLogger({ method: "revokeAllSessions" });
		logger.debug("Revoking all sessions");

		// Get refresh token from cookie
		const refreshCookie = this._getRefreshTokenFromCookie(req);
		logger.debug({ refreshCookie }, "Got refresh token from cookie");

		// Revoke all sessions
		const result = await this._authManager.revokeAllSessions({
			refreshToken: refreshCookie,
		});
		if (!result.success) {
			throw result.error;
		}
		logger.debug({ result: result.data }, "All sessions revoked");

		// Clear the access and refresh tokens cookies
		this._clearAuthCookies(res);
		logger.debug("Cleared access and refresh tokens cookies successfully");

		logger.info(
			{ revokedCount: result.data },
			"All sessions revoked successfully",
		);

		res.status(HTTP_STATUS.OK).json({
			data: {
				message: "All sessions revoked successfully",
			},
			meta: {
				revokedCount: result.data,
			},
			success: true,
		});
	});

	private _clearAuthCookies(res: Response): void {
		// clear access token cookie
		const clearAccessCookieResult = this._cookieService.delete({
			name: CookieName.ACCESS_TOKEN,
			response: res,
		});
		if (!clearAccessCookieResult.success) {
			throw clearAccessCookieResult.error;
		}

		// clear refresh token cookie
		const clearRefreshCookieResult = this._cookieService.delete({
			name: CookieName.REFRESH_TOKEN,
			response: res,
		});
		if (!clearRefreshCookieResult.success) {
			throw clearRefreshCookieResult.error;
		}
	}

	private _getLogger(args: { [key: string]: unknown; method: string }) {
		return getLoggerFromContext().child({ layer: "auth2 controller", ...args });
	}

	private _getRefreshTokenFromCookie(req: Request): string {
		const result = this._cookieService.get({
			name: CookieName.REFRESH_TOKEN,
			request: req,
			schema: jwtTokenValidator,
		});
		if (!result.success) {
			throw result.error;
		}

		return result.data;
	}

	private _setAccessTokenCookie(args: {
		expiresAt: Date;
		res: Response;
		token: string;
	}): void {
		const accessCookieResult = this._cookieService.set({
			item: {
				name: CookieName.ACCESS_TOKEN,
				value: args.token,
			},
			options: {
				expires: args.expiresAt,
				httpOnly: true,
			},
			response: args.res,
		});
		if (!accessCookieResult.success) {
			throw accessCookieResult.error;
		}
	}

	private _setAuthCookies(tokens: TokenPair, res: Response): void {
		this._setAccessTokenCookie({
			expiresAt: tokens.access.expiresAt,
			res,
			token: tokens.access.token,
		});
		this._setRefreshTokenCookie({
			expiresAt: tokens.refresh.expiresAt,
			res,
			token: tokens.refresh.token,
		});
	}

	private _setRefreshTokenCookie(args: {
		expiresAt: Date;
		res: Response;
		token: string;
	}): void {
		const refreshCookieResult = this._cookieService.set({
			item: {
				name: CookieName.REFRESH_TOKEN,
				value: args.token,
			},
			options: {
				expires: args.expiresAt,
				httpOnly: true,
			},
			response: args.res,
		});
		if (!refreshCookieResult.success) {
			throw refreshCookieResult.error;
		}
	}
}

export const auth2Controller = new Auth2Controller();
