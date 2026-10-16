import type { Request, Response } from "express";

import {
	HTTP_STATUS,
	SESSION_ABSOLUTE_TIMEOUT_MS,
	SESSION_COOKIE_NAME,
} from "../constants/index.js";
import { ValidationError } from "../errors/index.js";
import type { IAuthManager } from "../managers/index.js";
import { authManager } from "../managers/index.js";
import { demoRoleSchema } from "../schemas/demo/demo-role.schema.js";
import { sessionTokenSchema } from "../schemas/index.js";
import type { ICookieService } from "../services/index.js";
import { cookieService } from "../services/index.js";
import type {
	AsyncHandler,
	CreateUser,
	DemoRole,
	PublicSession,
	SafeSelectUser,
	Session,
	SignUpInput,
} from "../types/index.js";
import { asyncHandler, getLoggerFromContext } from "../utils/index.js";

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
		reqBody: SignUpInput;
		resBody: { data: SafeSelectUser };
	}>;

	/**
	 * POST /auth/signin
	 */
	signIn: AsyncHandler<{
		reqBody: Pick<CreateUser, "email" | "password">;
		resBody: { data: SafeSelectUser };
	}>;

	// Session Management
	/**
	 * GET /auth/sessions
	 */
	getUserSessions: AsyncHandler<{
		locals: { session: Session; user: SafeSelectUser };
		resBody: { data: Array<PublicSession> };
	}>;

	/**
	 * DELETE /auth/sessions/current
	 */
	signOut: AsyncHandler<{
		locals: { session: Session };
		resBody: never;
	}>;

	/**
	 * DELETE /auth/sessions
	 */
	signOutAll: AsyncHandler<{
		locals: { user: SafeSelectUser };
		resBody: never;
	}>;
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

		const result = await this._authManager.signInDemo({
			...validationResult.data,
			...this._getSessionContext(req),
		});
		if (!result.success) {
			throw result.error;
		}

		this._setSessionCookie(result.data, res);
		logger.debug("Set session cookie successfully");

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
	 * GET /auth/sessions
	 */
	getUserSessions = asyncHandler<{
		locals: { session: Session; user: SafeSelectUser };
		resBody: { data: Array<PublicSession> };
	}>(async (req, res) => {
		const logger = this._getLogger({ method: "getUserSessions" });
		logger.debug({ query: req.query }, "Getting user sessions");

		const result = await this._authManager.getUserSessions({
			currentSessionId: res.locals.session.id,
			userId: res.locals.user.id,
		});
		if (!result.success) {
			throw result.error;
		}

		logger.info(
			{ sessionCount: result.data.length },
			"User sessions retrieved successfully",
		);

		res.status(HTTP_STATUS.OK).json({
			data: result.data,
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
		const result = await this._authManager.signIn({
			...req.body,
			...this._getSessionContext(req),
		});
		if (!result.success) {
			throw result.error;
		}

		logger.debug({ result: result.data }, "User signed in");

		this._setSessionCookie(result.data, res);
		logger.debug("Set session cookie successfully");

		logger.info({ userId: result.data.user.id }, "User signed in successfully");

		res.status(HTTP_STATUS.OK).json({
			data: result.data.user,
			success: true,
		});
	});

	/**
	 * DELETE /auth/sessions/current
	 */
	signOut = asyncHandler<{
		locals: { session: Session };
		resBody: never;
	}>(async (req, res) => {
		const logger = this._getLogger({ method: "signOut" });
		logger.debug({ args: req.body }, "Signing out current session");

		// Delete the session
		const result = await this._authManager.signOut({
			sessionId: res.locals.session.id,
		});
		if (!result.success) {
			throw result.error;
		}
		logger.debug({ result: result.data }, "Session signed out");

		this._clearSessionCookie(res);
		logger.debug("Cleared session cookie successfully");

		logger.info("User signed out successfully");

		res.status(HTTP_STATUS.NO_CONTENT).end();
	});

	/**
	 * DELETE /auth/sessions
	 */
	signOutAll = asyncHandler<{
		locals: { user: SafeSelectUser };
		resBody: never;
	}>(async (_req, res) => {
		const logger = this._getLogger({ method: "signOutAll" });
		logger.debug("Signing out all sessions");

		// Delete all sessions
		const result = await this._authManager.signOutAll({
			userId: res.locals.user.id,
		});
		if (!result.success) {
			throw result.error;
		}
		logger.debug({ result: result.data }, "All sessions signed out");

		this._clearSessionCookie(res);
		logger.debug("Cleared session cookie successfully");

		logger.info(
			{ removedCount: result.data },
			"User signed out from all devices successfully",
		);

		res.status(HTTP_STATUS.NO_CONTENT).end();
	});

	/**
	 * POST /auth/signup
	 */
	signUp = asyncHandler<{
		reqBody: SignUpInput;
		resBody: { data: SafeSelectUser };
	}>(async (req, res) => {
		const logger = this._getLogger({ method: "signUp" });
		logger.debug({ args: req.body }, "Signing up user");

		// Create a session
		const result = await this._authManager.signUp({
			...req.body,
			...this._getSessionContext(req),
		});
		if (!result.success) {
			throw result.error;
		}

		logger.debug({ result: result.data }, "User signed up");

		this._setSessionCookie(result.data, res);
		logger.debug("Set session cookie successfully");

		logger.info({ userId: result.data.user.id }, "User signed up successfully");

		res.status(HTTP_STATUS.CREATED).json({
			data: result.data.user,
			success: true,
		});
	});

	private _clearSessionCookie(res: Response): void {
		const result = this._cookieService.delete({
			name: SESSION_COOKIE_NAME,
			response: res,
		});
		if (!result.success) {
			throw result.error;
		}
	}

	private _getLogger(args: { [key: string]: unknown; method: string }) {
		return getLoggerFromContext().child({ layer: "auth controller", ...args });
	}

	private _getSessionContext(req: Request): {
		previousToken?: string;
		userAgent: string;
	} {
		const cookieResult = this._cookieService.get({
			name: SESSION_COOKIE_NAME,
			request: req,
			schema: sessionTokenSchema,
		});

		return {
			previousToken: cookieResult.success ? cookieResult.data : undefined,
			userAgent: req.get("user-agent") ?? "",
		};
	}

	private _setSessionCookie(
		args: { session: Session; token: string },
		res: Response,
	): void {
		const result = this._cookieService.set({
			item: {
				name: SESSION_COOKIE_NAME,
				value: args.token,
			},
			options: {
				// the absolute cap; idle expiry is enforced on the server
				expires: new Date(
					args.session.createdAt.getTime() + SESSION_ABSOLUTE_TIMEOUT_MS,
				),
				httpOnly: true,
			},
			response: res,
		});
		if (!result.success) {
			throw result.error;
		}
	}
}

export const authController = new AuthController();
