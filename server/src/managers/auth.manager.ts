import { DEMO_ACCOUNT_EMAILS } from "../constants/index.js";
import {
	ConflictError,
	InvalidCredentialsError,
	NotFoundError,
	ValidationError,
} from "../errors/index.js";
import type {
	IPasswordService,
	ISessionService,
	IUserService,
} from "../services/index.js";
import {
	passwordService,
	sessionService,
	userService,
} from "../services/index.js";
import type {
	DemoAccountRole,
	MethodParams,
	MethodReturn,
	PublicSession,
	Result,
	SafeSelectUser,
	Session,
	SignUpInput,
} from "../types/index.js";
import { getLoggerFromContext } from "../utils/index.js";

// helpers types
type AuthResult<T> = Result<T>;

type AuthSession = {
	session: Session;
	// raw session token for the cookie - never log or store it
	token: string;
	user: SafeSelectUser;
};

type SessionContext = {
	// token from an existing cookie, replaced on sign-in
	previousToken?: string;
	userAgent: string;
};

// interfaces
export interface IAuthManager {
	getUserSessions(args: {
		currentSessionId: string;
		userId: string;
	}): Promise<AuthResult<Array<PublicSession>>>;

	signIn(
		args: SessionContext & { email: string; password: string },
	): Promise<AuthResult<AuthSession>>;

	signInDemo(
		args: SessionContext & { role: DemoAccountRole },
	): Promise<AuthResult<AuthSession>>;

	signOut(args: { sessionId: string }): Promise<AuthResult<undefined>>;

	signOutAll(args: { userId: string }): Promise<AuthResult<number>>;

	signUp(args: SessionContext & SignUpInput): Promise<AuthResult<AuthSession>>;
}

export class AuthManager implements IAuthManager {
	private readonly _password: IPasswordService;
	private readonly _session: ISessionService;
	private readonly _user: IUserService;

	constructor(
		password?: IPasswordService,
		session?: ISessionService,
		user?: IUserService,
	) {
		this._password = password ?? passwordService;
		this._session = session ?? sessionService;
		this._user = user ?? userService;
	}

	public async getUserSessions(
		args: MethodParams<IAuthManager, "getUserSessions">,
	): MethodReturn<IAuthManager, "getUserSessions"> {
		const result = await this._session.getAllByUserId({ userId: args.userId });
		if (!result.success) {
			return result;
		}

		return {
			data: result.data.map((session) => ({
				createdAt: session.createdAt,
				id: session.id,
				isCurrent: session.id === args.currentSessionId,
				lastSeenAt: session.lastSeenAt,
				userAgent: session.userAgent,
			})),
			success: true,
		};
	}

	public async signIn(
		args: MethodParams<IAuthManager, "signIn">,
	): MethodReturn<IAuthManager, "signIn"> {
		const logger = this.getLogger({ method: "signIn" });

		if (!args?.email || !args?.password) {
			logger.warn("Sign in failed - missing email or password");
			return {
				error: new ValidationError("Email and password are required"),
				success: false,
			};
		}

		const userResult = await this._user.getByEmail_UNSAFE({
			email: args.email,
		});
		if (!userResult.success) {
			logger.warn({ email: args.email }, "Sign in failed - invalid email");
			return {
				error: new InvalidCredentialsError("Invalid email or password"),
				success: false,
			};
		}

		const isPasswordValid = await this._password.verify({
			hashedPassword: userResult.data.password,
			password: args.password,
		});
		if (!isPasswordValid.success) {
			// Error already logged in password service
			logger.warn({ email: args.email }, "Sign in failed - invalid password");
			return {
				error: new InvalidCredentialsError("Invalid email or password", {
					cause: isPasswordValid.error,
				}),
				success: false,
			};
		}

		const sanitizeResult = this._user.sanitizeUser(userResult.data);
		if (!sanitizeResult.success) {
			// Error already logged in user service
			return sanitizeResult;
		}

		const authSessionResult = await this._createAuthSession({
			previousToken: args.previousToken,
			user: sanitizeResult.data,
			userAgent: args.userAgent,
		});
		if (!authSessionResult.success) {
			// Error already logged in _createAuthSession
			return authSessionResult;
		}

		logger.info(
			{ email: args.email, userId: sanitizeResult.data.id },
			"User signed in successfully",
		);
		return authSessionResult;
	}

	public async signInDemo(
		args: MethodParams<IAuthManager, "signInDemo">,
	): MethodReturn<IAuthManager, "signInDemo"> {
		const logger = this.getLogger({ method: "signInDemo" });

		const email = args?.role && DEMO_ACCOUNT_EMAILS[args.role];
		if (!email) {
			logger.warn({ role: args?.role }, "Demo sign in failed - invalid role");
			return {
				error: new ValidationError("Invalid demo account role"),
				success: false,
			};
		}

		const userResult = await this._user.getByEmail_UNSAFE({ email });
		if (!userResult.success) {
			logger.warn({ email }, "Demo sign in failed - demo account unavailable");
			return {
				error: new InvalidCredentialsError("Demo account is unavailable"),
				success: false,
			};
		}

		const sanitizeResult = this._user.sanitizeUser(userResult.data);
		if (!sanitizeResult.success) {
			return sanitizeResult;
		}

		const authSessionResult = await this._createAuthSession({
			previousToken: args.previousToken,
			user: sanitizeResult.data,
			userAgent: args.userAgent,
		});
		if (!authSessionResult.success) {
			return authSessionResult;
		}

		logger.info(
			{ email, role: args.role, userId: sanitizeResult.data.id },
			"Demo user signed in successfully",
		);

		return authSessionResult;
	}

	public async signOut(
		args: MethodParams<IAuthManager, "signOut">,
	): MethodReturn<IAuthManager, "signOut"> {
		const logger = this.getLogger({ method: "signOut" });

		const result = await this._session.deleteById({
			sessionId: args.sessionId,
		});
		if (!result.success) {
			return result;
		}

		logger.info({ sessionId: args.sessionId }, "User signed out");
		return {
			data: undefined,
			success: true,
		};
	}

	public async signOutAll(
		args: MethodParams<IAuthManager, "signOutAll">,
	): MethodReturn<IAuthManager, "signOutAll"> {
		const logger = this.getLogger({ method: "signOutAll" });

		const result = await this._session.deleteAllByUserId({
			userId: args.userId,
		});
		if (!result.success) {
			return result;
		}

		logger.info(
			{ deletedCount: result.data, userId: args.userId },
			"All sessions signed out",
		);
		return {
			data: result.data,
			success: true,
		};
	}

	public async signUp(
		args: MethodParams<IAuthManager, "signUp">,
	): MethodReturn<IAuthManager, "signUp"> {
		const logger = this.getLogger({ method: "signUp" });

		if (!args?.email || !args?.password || !args?.name) {
			logger.warn("Sign up failed - missing required fields");
			return {
				error: new ValidationError("Email, password and name are required"),
				success: false,
			};
		}

		const userExistsResult = await this._user.existsByEmail({
			email: args.email,
		});
		if (
			!userExistsResult.success &&
			!(userExistsResult.error instanceof NotFoundError)
		) {
			return userExistsResult;
		}
		if (userExistsResult.success && userExistsResult.data) {
			logger.warn(
				{ email: args.email },
				"Sign up failed - email already exists",
			);
			return {
				error: new ConflictError("An account with this email already exists"),
				success: false,
			};
		}

		const hashedPasswordResult = await this._password.hash({
			password: args.password,
		});
		if (!hashedPasswordResult.success) {
			// Error already logged in password service
			return hashedPasswordResult;
		}

		const createUserResult = await this._user.create({
			email: args.email,
			isAdmin: false,
			name: args.name,
			password: hashedPasswordResult.data,
		});
		if (!createUserResult.success) {
			// Error already logged in user service
			return createUserResult;
		}

		const authSessionResult = await this._createAuthSession({
			previousToken: args.previousToken,
			user: createUserResult.data,
			userAgent: args.userAgent,
		});
		if (!authSessionResult.success) {
			// Error already logged in _createAuthSession
			return authSessionResult;
		}

		logger.info(
			{ email: args.email, userId: createUserResult.data.id },
			"User signed up successfully",
		);
		return authSessionResult;
	}

	private async _createAuthSession(
		args: SessionContext & { user: SafeSelectUser },
	): Promise<AuthResult<AuthSession>> {
		const logger = this.getLogger({ method: "_createAuthSession" });

		// a new sign-in always gets a fresh token (prevents session fixation)
		if (args.previousToken) {
			const deleteResult = await this._session.deleteByToken({
				token: args.previousToken,
			});
			if (!deleteResult.success) {
				return deleteResult;
			}
		}

		const sessionResult = await this._session.create({
			userAgent: args.userAgent,
			userId: args.user.id,
		});
		if (!sessionResult.success) {
			// Error already logged in session service
			return sessionResult;
		}

		logger.debug(
			{ sessionId: sessionResult.data.session.id, userId: args.user.id },
			"Auth session created",
		);
		return {
			data: { ...sessionResult.data, user: args.user },
			success: true,
		};
	}

	private getLogger(args: { [key: string]: unknown; method: string }) {
		return getLoggerFromContext().child(args);
	}
}

export const authManager = new AuthManager();
