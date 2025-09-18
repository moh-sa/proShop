import type { Request, Response } from "express";

import type { IAuthManager } from "../managers/index.js";
import type { ICookieService } from "../services/index.js";
import type {
	AsyncRequestHandler,
	InsertUser,
	SafeSelectUser,
	SelectSession,
	TokenPair,
} from "../types/index.js";

import { CookieName, HTTP_STATUS } from "../constants/index.js";
import { AuthManager } from "../managers/index.js";
import { insertUserSchema } from "../schemas/index.js";
import { CookieService } from "../services/index.js";
import { asyncHandler } from "../utils/index.js";
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
	signUp: AsyncRequestHandler<InsertUser, { user: SafeSelectUser }>;

	/**
	 * POST /auth/signin
	 */
	signIn: AsyncRequestHandler<
		Pick<InsertUser, "email" | "password">,
		{ user: SafeSelectUser }
	>;

	/**
	 * DELETE /auth/signout/current
	 */
	signOut: AsyncRequestHandler<unknown, { message: string }>;

	/**
	 * DELETE /auth/signout
	 */
	signOutAll: AsyncRequestHandler<
		unknown,
		{ message: string },
		{ removedCount: number }
	>;

	// Token Management
	/**
	 * POST /auth/token/refresh
	 */
	refreshAccessToken: AsyncRequestHandler<unknown, { message: string }>;

	// Session Management
	/**
	 * GET /auth/sessions
	 */
	getUserSessions: AsyncRequestHandler<
		unknown,
		{ sessions: Array<SelectSession> }
	>;

	/**
	 * DELETE /auth/sessions/current
	 */
	revokeSession: AsyncRequestHandler<unknown, { message: string }>;
}

/**
 * Authentication Controller (v2)
 * @remarks The v1 Auth controller is being deprecated soon.
 */
export class Auth2Controller implements IAuth2Controller {
	private readonly _authManager: IAuthManager;

	private readonly _cookieService: ICookieService;
	constructor(
		authManager: IAuthManager = new AuthManager(),
		cookieService: ICookieService = new CookieService(),
	) {
		this._authManager = authManager;
		this._cookieService = cookieService;
	}

	/**
	 * POST /auth/signin
	 */
	signIn = asyncHandler<
		Pick<InsertUser, "email" | "password">,
		{ user: SafeSelectUser }
	>(async (req, res) => {
		// Validate request body
		const data = insertUserSchema
			.pick({ email: true, password: true })
			.parse(req.body);

		console.info("[AUTH] Sign-in attempt for email: ", data.email);

		// Create a session
		const result = await this._authManager.signIn(data);
		if (!result.success) {
			console.error(
				`[AUTH] Sign-in failed for email: ${data.email} - ${result.error.message}`,
			);
			throw result.error;
		}

		// Set access and refresh tokens in cookies
		this._setAuthCookies(result.data.tokens, res);

		console.info(`[AUTH] Sign-in successful for email: ${data.email}`);

		return res.status(HTTP_STATUS.OK).json({
			data: {
				user: result.data.user,
			},
			success: true,
		});
	});

	/**
	 * POST /auth/signup
	 */
	signUp = asyncHandler<InsertUser, { user: SafeSelectUser }>(
		async (req, res) => {
			// Validate request body
			const data = insertUserSchema.parse(req.body);

			console.info(`[AUTH] Sign-up attempt for email: ${data.email}`);

			// Create a session
			const result = await this._authManager.signUp(data);
			if (!result.success) {
				console.error(
					`[AUTH] Sign-up failed for email: ${data.email} - ${result.error.message}`,
				);
				throw result.error;
			}

			// Set access and refresh tokens in cookies
			this._setAuthCookies(result.data.tokens, res);

			console.info(`[AUTH] Sign-up successful for email: ${data.email}`);

			return res.status(HTTP_STATUS.CREATED).json({
				data: {
					user: result.data.user,
				},
				success: true,
			});
		},
	);

	/**
	 * DELETE /auth/signout/current
	 */
	signOut = asyncHandler<unknown, { message: string }>(async (req, res) => {
		console.info(`[AUTH] Sign-out attempt`);

		// Get refresh token from cookie
		const refreshCookie = this._getRefreshTokenFromCookie(req);

		// Delete the session
		const result = await this._authManager.signOut({
			refreshToken: refreshCookie,
		});
		if (!result.success) {
			console.error(`[AUTH] Sign-out failed - ${result.error.message}`);
			throw result.error;
		}

		// Clear the access and refresh tokens cookies
		this._clearAuthCookies(res);

		console.info(`[AUTH] Sign-out successful`);

		res.status(HTTP_STATUS.OK).json({
			data: {
				message: "Logged out successfully",
			},
			success: true,
		});
	});

	/**
	 * DELETE /auth/signout
	 */
	signOutAll = asyncHandler<
		unknown,
		{ message: string },
		{ removedCount: number }
	>(async (req, res) => {
		console.info(`[AUTH] Sign-out-all attempt`);

		// Get refresh token from cookie
		const refreshCookie = this._getRefreshTokenFromCookie(req);

		// Delete all sessions
		const result = await this._authManager.signOutAll({
			refreshToken: refreshCookie,
		});
		if (!result.success) {
			console.error(`[AUTH] Sign-out-all failed - ${result.error.message}`);
			throw result.error;
		}

		// Clear the access and refresh tokens cookies
		this._clearAuthCookies(res);

		console.info(
			`[AUTH] Sign-out-all successful - revoked ${result.data} sessions`,
		);

		return res.status(HTTP_STATUS.OK).json({
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
	refreshAccessToken = asyncHandler<unknown, { message: string }>(
		async (req, res) => {
			console.info(`[AUTH] Access token refresh attempt`);

			// Get refresh token from cookie
			const refreshCookie = this._getRefreshTokenFromCookie(req);

			// Refresh access token
			const accessTokenResult = await this._authManager.refreshAccessToken({
				refreshToken: refreshCookie,
			});
			if (!accessTokenResult.success) {
				console.error(
					`[AUTH] Access token refresh failed - ${accessTokenResult.error.message}`,
				);
				throw accessTokenResult.error;
			}

			// Set the new access token in the cookie
			this._setAccessTokenCookie({
				expiresAt: accessTokenResult.data.expiresAt,
				res,
				token: accessTokenResult.data.token,
			});

			console.info(`[AUTH] Access token refresh successful`);

			return res.status(HTTP_STATUS.OK).json({
				data: {
					message: "Access token refreshed successfully",
				},
				success: true,
			});
		},
	);

	/**
	 * GET /auth/sessions
	 */
	getUserSessions = asyncHandler<unknown, { sessions: Array<SelectSession> }>(
		async (req, res) => {
			console.info(`[AUTH] Get user sessions attempt`);

			// Get refresh token from cookie
			const refreshCookie = this._getRefreshTokenFromCookie(req);

			// Get user sessions
			const result = await this._authManager.getUserSessions({
				refreshToken: refreshCookie,
			});
			if (!result.success) {
				console.error(
					`[AUTH] Get user sessions failed - ${result.error.message}`,
				);
				throw result.error;
			}

			console.info(
				`[AUTH] Get user sessions successful - ${result.data.length} sessions found`,
			);

			return res.status(HTTP_STATUS.OK).json({
				data: {
					sessions: result.data,
				},
				success: true,
			});
		},
	);

	/**
	 * DELETE /auth/sessions/current
	 */
	revokeSession = asyncHandler<unknown, { message: string }>(
		async (req, res) => {
			console.info(`[AUTH] Revoke session attempt`);

			// Get refresh token from cookie
			const refreshCookie = this._getRefreshTokenFromCookie(req);

			// Revoke session
			const result = await this._authManager.revokeSession({
				refreshToken: refreshCookie,
			});
			if (!result.success) {
				console.error(`[AUTH] Revoke session failed - ${result.error.message}`);
				throw result.error;
			}

			// Clear the access and refresh tokens cookies
			this._clearAuthCookies(res);

			console.info(`[AUTH] Revoke session successful`);

			return res.status(HTTP_STATUS.OK).json({
				data: {
					message: "Session revoked successfully",
				},
				success: true,
			});
		},
	);

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
				httpOnly: false,
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
