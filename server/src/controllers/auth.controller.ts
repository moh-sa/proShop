import type { Request, Response } from "express";

import { HTTP_STATUS } from "../constants/index.js";
import { ValidationError } from "../errors/index.js";
import type { IAuthManager } from "../managers/index.js";
import { authManager } from "../managers/index.js";
import { demoRoleSchema } from "../schemas/demo/demo-role.schema.js";
import type { ICookieService } from "../services/index.js";
import { cookieService } from "../services/index.js";
import type {
	AsyncHandler,
	CreateUser,
	DemoRole,
	GetAllSessionsByUserIdControllerParams,
	PaginatedResponse,
	SafeSelectUser,
	Session,
	TokenPair,
} from "../types/index.js";
import { asyncHandler, getLoggerFromContext } from "../utils/index.js";
import { jwtTokenValidator } from "../validators/index.js";

/**
 * Authentication Controller Interface
 */
export interface IAuthController {
	// User Registration & Authentication
	/**
	 * POST /auth/demo-signin
	 */
	demoSignIn: AsyncHandler<{
		reqBody: DemoRole;
		resBody: { data: SafeSelectUser };
	}>;

	/**
	 * POST /auth/signup
	 */
	signUp: AsyncHandler<{
		reqBody: CreateUser;
		resBody: { data: SafeSelectUser };
	}>;

	/**
	 * POST /auth/signin
	 */
	signIn: AsyncHandler<{
		reqBody: Pick<CreateUser, "email" | "password">;
		resBody: { data: SafeSelectUser };
	}>;

	/**
	 * DELETE /auth/signout/current
	 */
	signOut: AsyncHandler<{ resBody: never }>;

	/**
	 * DELETE /auth/signout
	 */
	signOutAll: AsyncHandler<{ resBody: never }>;

	// Token Management
	/**
	 * POST /auth/token/refresh
	 */
	refreshAccessToken: AsyncHandler;

	// Session Management
	/**
	 * GET /auth/sessions
	 */
	getUserSessions: AsyncHandler<{
		query: GetAllSessionsByUserIdControllerParams;
		resBody: {
			data: PaginatedResponse<Session>["items"];
			meta: PaginatedResponse<Session>["meta"];
		};
	}>;

	/**
	 * DELETE /auth/sessions/current
	 */
	revokeSession: AsyncHandler<{ resBody: never }>;

	/**
	 * DELETE /auth/sessions
	 */
	revokeAllSessions: AsyncHandler<{ resBody: never }>;
}

/**
 * Authentication Controller
 */
export class AuthController implements IAuthController {
	private readonly _authManager: IAuthManager;

	private readonly _cookieService: ICookieService;

	constructor(auth?: IAuthManager, cookie?: ICookieService) {
		this._authManager = auth ?? authManager;
		this._cookieService = cookie ?? cookieService;
	}

	/**
	 * POST /auth/demo-signin
	 */
	demoSignIn = asyncHandler<{
		reqBody: DemoRole;
		resBody: { data: SafeSelectUser };
	}>(async (req, res) => {
		const logger = this._getLogger({ method: "demoSignIn" });
		logger.debug({ args: req.body }, "Signing in demo user");

		const validationResult = demoRoleSchema.safeParse(req.body);
		if (!validationResult.success) {
			throw new ValidationError("Invalid demo sign in data", {
				cause: validationResult.error,
			});
		}

		const result = await this._authManager.signInDemo(validationResult.data);
		if (!result.success) {
			throw result.error;
		}

		this._setAuthCookies(result.data.tokens, res);
		logger.debug("Set access and refresh tokens in cookies successfully");

		logger.info(
			{ role: validationResult.data.role, userId: result.data.user.id },
			"Demo user signed in successfully",
		);

		res.status(HTTP_STATUS.OK).json({
			data: result.data.user,
			success: true,
		});
	});

	/**
	 * POST /auth/signin
	 */
	signIn = asyncHandler<{
		reqBody: Pick<CreateUser, "email" | "password">;
		resBody: { data: SafeSelectUser };
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

		logger.info({ userId: result.data.user.id }, "User signed in successfully");

		res.status(HTTP_STATUS.OK).json({
			data: result.data.user,
			success: true,
		});
	});

	/**
	 * POST /auth/signup
	 */
	signUp = asyncHandler<{
		reqBody: CreateUser;
		resBody: { data: SafeSelectUser };
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

		logger.info({ userId: result.data.user.id }, "User signed up successfully");

		res.status(HTTP_STATUS.CREATED).json({
			data: result.data.user,
			success: true,
		});
	});

	/**
	 * DELETE /auth/signout/current
	 */
	signOut = asyncHandler<{ resBody: never }>(async (req, res) => {
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

		res.status(HTTP_STATUS.NO_CONTENT).end();
	});

	/**
	 * DELETE /auth/signout
	 */
	signOutAll = asyncHandler<{ resBody: never }>(async (req, res) => {
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

		res.status(HTTP_STATUS.NO_CONTENT).end();
	});

	/**
	 * POST /auth/token/refresh
	 */
	refreshAccessToken = asyncHandler(async (req, res) => {
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

		res.status(HTTP_STATUS.OK).end();
	});

	/**
	 * GET /auth/sessions
	 */
	getUserSessions = asyncHandler<{
		query: GetAllSessionsByUserIdControllerParams;
		resBody: {
			data: PaginatedResponse<Session>["items"];
			meta: PaginatedResponse<Session>["meta"];
		};
	}>(async (req, res) => {
		const logger = this._getLogger({ method: "getUserSessions" });
		logger.debug({ query: req.query }, "Getting user sessions");

		// Get refresh token from cookie
		const refreshToken = this._getRefreshTokenFromCookie(req);
		logger.debug({ refreshToken }, "Got refresh token from cookie");

		const result = await this._authManager.getUserSessions({
			pageNumber: req.query.pageNumber,
			pageSize: req.query.pageSize,
			refreshToken,
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
	revokeSession = asyncHandler<{ resBody: never }>(async (req, res) => {
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

		res.status(HTTP_STATUS.NO_CONTENT).end();
	});

	/**
	 * DELETE /auth/sessions
	 */
	revokeAllSessions = asyncHandler<{ resBody: never }>(async (req, res) => {
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

		res.status(HTTP_STATUS.NO_CONTENT).end();
	});

	private _clearAuthCookies(res: Response): void {
		// clear access token cookie
		const clearAccessCookieResult = this._cookieService.delete({
			name: "accessToken",
			response: res,
		});
		if (!clearAccessCookieResult.success) {
			throw clearAccessCookieResult.error;
		}

		// clear refresh token cookie
		const clearRefreshCookieResult = this._cookieService.delete({
			name: "refreshToken",
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
			name: "refreshToken",
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
				name: "accessToken",
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
				name: "refreshToken",
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

export const authController = new AuthController();
