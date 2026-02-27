import type {
	IJwtService,
	IPasswordService,
	ISessionService,
	IUserService,
} from "../services/index.js";
import type {
	InsertUser,
	MethodParams,
	MethodReturn,
	PaginatedResponse,
	PaginationParamsString,
	Result,
	SafeSelectUser,
	SelectSession,
	TokenPair,
	UnSafeSelectUser,
} from "../types/index.js";

import {
	ConflictError,
	InvalidCredentialsError,
	ValidationError,
} from "../errors/index.js";
import {
	JwtService,
	PasswordService,
	SessionService,
	UserService,
} from "../services/index.js";
import { TokenType } from "../types/index.js";
import { getLoggerFromContext } from "../utils/index.js";

// helpers types
type AuthResult<T> = Result<T>;

// interfaces
export interface IAuthManager {
	getUserSessions(
		args: Omit<PaginationParamsString, "pipeline" | "query"> & {
			refreshToken: string;
		},
	): Promise<AuthResult<PaginatedResponse<SelectSession>>>;

	refreshAccessToken(args: { refreshToken: string }): Promise<
		AuthResult<{
			expiresAt: Date;
			token: string;
			// user: SafeSelectUser;
		}>
	>;

	revokeAllSessions(args: {
		refreshToken: string;
	}): Promise<AuthResult<number>>;

	revokeSession(args: { refreshToken: string }): Promise<AuthResult<undefined>>;

	signIn(args: Pick<InsertUser, "email" | "password">): Promise<
		AuthResult<{
			sessionId: string;
			tokens: TokenPair;
			user: SafeSelectUser;
		}>
	>;

	signOut(args: { refreshToken: string }): Promise<AuthResult<undefined>>;

	signOutAll(args: { refreshToken: string }): Promise<AuthResult<number>>;

	signUp(args: InsertUser): Promise<
		AuthResult<{
			sessionId: string;
			tokens: TokenPair;
			user: SafeSelectUser;
		}>
	>;
}

export class AuthManager implements IAuthManager {
	private readonly _jwt: IJwtService;
	private readonly _password: IPasswordService;
	private readonly _session: ISessionService;
	private readonly _user: IUserService;

	constructor(
		jwt?: IJwtService,
		password?: IPasswordService,
		session?: ISessionService,
		user?: IUserService,
	) {
		this._jwt = jwt ?? new JwtService();
		this._password = password ?? new PasswordService();
		this._session = session ?? new SessionService();
		this._user = user ?? new UserService();
	}

	public async getUserSessions(
		args: MethodParams<IAuthManager, "getUserSessions">,
	): MethodReturn<IAuthManager, "getUserSessions"> {
		if (!args?.refreshToken) {
			return {
				error: new ValidationError("Refresh token is required"),
				success: false,
			};
		}

		const refreshTokenValidationResult = this._jwt.verify({
			expectedType: TokenType.REFRESH,
			token: args.refreshToken,
		});
		if (!refreshTokenValidationResult.success) {
			return refreshTokenValidationResult;
		}

		const userId = refreshTokenValidationResult.data.userId;

		const result = await this._session.getActiveByUserId({
			pageNumber: args.pageNumber,
			pageSize: args.pageSize,
			sort: args.sort,
			userId,
		});
		if (!result.success) {
			return result;
		}

		return {
			data: result.data,
			success: true,
		};
	}

	public async refreshAccessToken(
		args: MethodParams<IAuthManager, "refreshAccessToken">,
	): MethodReturn<IAuthManager, "refreshAccessToken"> {
		if (!args?.refreshToken) {
			return {
				error: new ValidationError("Refresh token is required"),
				success: false,
			};
		}

		const tokenValidationResult = this._jwt.verify({
			expectedType: TokenType.REFRESH,
			token: args.refreshToken,
		});
		if (!tokenValidationResult.success) {
			return tokenValidationResult;
		}

		const sessionValidationResult = await this._session.validate({
			tokenId: tokenValidationResult.data.tokenId,
			userId: tokenValidationResult.data.userId,
		});
		if (!sessionValidationResult.success) {
			return sessionValidationResult;
		}

		const accessTokenResult = this._jwt.generateAccessToken({
			userId: tokenValidationResult.data.userId,
		});
		if (!accessTokenResult.success) {
			return accessTokenResult;
		}

		return {
			data: {
				expiresAt: accessTokenResult.data.expiresAt,
				token: accessTokenResult.data.token,
			},
			success: true,
		};
	}

	public async revokeAllSessions(args: {
		refreshToken: string;
	}): Promise<AuthResult<number>> {
		if (!args?.refreshToken) {
			return {
				error: new ValidationError("Refresh token is required"),
				success: false,
			};
		}

		const refreshTokenValidationResult = this._jwt.verify({
			expectedType: TokenType.REFRESH,
			token: args.refreshToken,
		});
		if (!refreshTokenValidationResult.success) {
			return refreshTokenValidationResult;
		}

		const result = await this._session.revokeAllByUserId({
			userId: refreshTokenValidationResult.data.userId,
		});
		if (!result.success) {
			return result;
		}

		return {
			data: result.data,
			success: true,
		};
	}

	public async revokeSession(
		args: MethodParams<IAuthManager, "revokeSession">,
	): MethodReturn<IAuthManager, "revokeSession"> {
		if (!args?.refreshToken) {
			return {
				error: new ValidationError("Refresh token is required"),
				success: false,
			};
		}

		const refreshTokenValidationResult = this._jwt.verify({
			expectedType: TokenType.REFRESH,
			token: args.refreshToken,
		});
		if (!refreshTokenValidationResult.success) {
			return refreshTokenValidationResult;
		}

		const result = await this._session.revokeByTokenIdAndUserId({
			tokenId: refreshTokenValidationResult.data.tokenId,
			userId: refreshTokenValidationResult.data.userId,
		});
		if (!result.success) {
			return result;
		}

		return {
			data: undefined,
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

		const authSessionResult = await this._createAuthSession(
			sanitizeResult.data,
		);
		if (!authSessionResult.success) {
			// Error already logged in _createAuthSession
			return authSessionResult;
		}

		logger.info(
			{ email: args.email, userId: sanitizeResult.data._id },
			"User signed in successfully",
		);
		return authSessionResult;
	}

	public async signOut(
		args: MethodParams<IAuthManager, "signOut">,
	): MethodReturn<IAuthManager, "signOut"> {
		const logger = this.getLogger({ method: "signOut" });

		if (!args?.refreshToken) {
			logger.warn("Sign out failed - missing refresh token");
			return {
				error: new ValidationError("Refresh token is required"),
				success: false,
			};
		}

		const tokenResult = this._jwt.verify({
			expectedType: TokenType.REFRESH,
			token: args.refreshToken as string,
		});
		if (!tokenResult.success) {
			// Error already logged in JWT service
			return tokenResult;
		}

		const deletedSessionResult = await this._session.deleteByTokenIdAndUserId({
			tokenId: tokenResult.data.tokenId,
			userId: tokenResult.data.userId,
		});
		if (!deletedSessionResult.success) {
			// Error already logged in session service
			return deletedSessionResult;
		}

		logger.info({ userId: tokenResult.data.userId }, "User signed out");
		return {
			data: undefined,
			success: true,
		};
	}

	public async signOutAll(
		args: MethodParams<IAuthManager, "signOutAll">,
	): MethodReturn<IAuthManager, "signOutAll"> {
		const logger = this.getLogger({ method: "signOutAll" });

		if (!args?.refreshToken) {
			logger.warn("Sign out all failed - missing refresh token");
			return {
				error: new ValidationError("Refresh token is required"),
				success: false,
			};
		}

		const refreshTokenResult = this._jwt.verify({
			expectedType: TokenType.REFRESH,
			token: args.refreshToken,
		});
		if (!refreshTokenResult.success) {
			// Error already logged in JWT service
			return refreshTokenResult;
		}

		const userId = refreshTokenResult.data.userId;

		const result = await this._session.deleteAllByUserId({
			userId,
		});
		if (!result.success) {
			// Error already logged in session service
			return result;
		}

		logger.info(
			{ deletedCount: result.data, userId },
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
		if (!userExistsResult.success) {
			// Error already logged in user service
			return userExistsResult;
		}
		if (userExistsResult.data) {
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
			...args,
			password: hashedPasswordResult.data,
		});
		if (!createUserResult.success) {
			// Error already logged in user service
			return createUserResult;
		}

		const authSessionResult = await this._createAuthSession(
			createUserResult.data,
		);
		if (!authSessionResult.success) {
			// Error already logged in _createAuthSession
			return authSessionResult;
		}

		logger.info(
			{ email: args.email, userId: createUserResult.data._id },
			"User signed up successfully",
		);
		return authSessionResult;
	}

	private async _createAuthSession(
		user: SafeSelectUser | UnSafeSelectUser,
	): Promise<
		AuthResult<{
			sessionId: string;
			tokens: TokenPair;
			user: SafeSelectUser;
		}>
	> {
		const logger = this.getLogger({ method: "_createAuthSession" });

		const tokensResult = this._jwt.generateTokenPair({
			userId: user._id.toString(),
		});
		if (!tokensResult.success) {
			// Error already logged in JWT service
			return tokensResult;
		}

		const sessionResult = await this._session.create({
			expiresAt: tokensResult.data.refresh.expiresAt,
			tokenId: tokensResult.data.refresh.tokenId,
			userId: user._id,
		});
		if (!sessionResult.success) {
			// Error already logged in session service
			return sessionResult;
		}

		logger.debug(
			{ sessionId: sessionResult.data.id, userId: user._id },
			"Auth session created",
		);
		return {
			data: {
				sessionId: sessionResult.data.id.toString(),
				tokens: tokensResult.data,
				user,
			},
			success: true,
		};
	}

	private getLogger(args: { [key: string]: unknown; method: string }) {
		return getLoggerFromContext().child(args);
	}
}

export const authManager = new AuthManager();
