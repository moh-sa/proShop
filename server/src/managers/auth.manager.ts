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
		jwt: IJwtService = new JwtService(),
		password: IPasswordService = new PasswordService(),
		session: ISessionService = new SessionService(),
		user: IUserService = new UserService(),
	) {
		this._jwt = jwt;
		this._password = password;
		this._session = session;
		this._user = user;
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
		if (!args?.email || !args?.password) {
			return {
				error: new ValidationError("Email and password are required"),
				success: false,
			};
		}

		const userResult = await this._user.getByEmail_UNSAFE({
			email: args.email,
		});
		if (!userResult.success) {
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
			return {
				error: new InvalidCredentialsError("Invalid email or password", {
					cause: isPasswordValid.error,
				}),
				success: false,
			};
		}

		const sanitizeResult = this._user.sanitizeUser(userResult.data);
		if (!sanitizeResult.success) {
			return sanitizeResult;
		}

		return this._createAuthSession(sanitizeResult.data);
	}

	public async signOut(
		args: MethodParams<IAuthManager, "signOut">,
	): MethodReturn<IAuthManager, "signOut"> {
		if (!args?.refreshToken) {
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
			return tokenResult;
		}

		const deletedSessionResult = await this._session.deleteByTokenIdAndUserId({
			tokenId: tokenResult.data.tokenId,
			userId: tokenResult.data.userId,
		});
		if (!deletedSessionResult.success) {
			return deletedSessionResult;
		}

		return {
			data: undefined,
			success: true,
		};
	}

	public async signOutAll(
		args: MethodParams<IAuthManager, "signOutAll">,
	): MethodReturn<IAuthManager, "signOutAll"> {
		if (!args?.refreshToken) {
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
			return refreshTokenResult;
		}

		const userId = refreshTokenResult.data.userId;

		const result = await this._session.deleteAllByUserId({
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

	public async signUp(
		args: MethodParams<IAuthManager, "signUp">,
	): MethodReturn<IAuthManager, "signUp"> {
		if (!args?.email || !args?.password || !args?.name) {
			return {
				error: new ValidationError("Email, password and name are required"),
				success: false,
			};
		}

		const userExistsResult = await this._user.existsByEmail({
			email: args.email,
		});
		if (!userExistsResult.success) {
			return userExistsResult;
		}
		if (userExistsResult.data) {
			return {
				error: new ConflictError("An account with this email already exists"),
				success: false,
			};
		}

		const hashedPasswordResult = await this._password.hash({
			password: args.password,
		});
		if (!hashedPasswordResult.success) {
			return hashedPasswordResult;
		}

		const createUserResult = await this._user.create({
			...args,
			password: hashedPasswordResult.data,
		});
		if (!createUserResult.success) {
			return createUserResult;
		}

		return this._createAuthSession(createUserResult.data);
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
		const tokensResult = this._jwt.generateTokenPair({
			userId: user._id.toString(),
		});
		if (!tokensResult.success) {
			return tokensResult;
		}

		const sessionResult = await this._session.create({
			expiresAt: tokensResult.data.refresh.expiresAt,
			tokenId: tokensResult.data.refresh.tokenId,
			userId: user._id,
		});
		if (!sessionResult.success) {
			return sessionResult;
		}

		return {
			data: {
				sessionId: sessionResult.data.id.toString(),
				tokens: tokensResult.data,
				user,
			},
			success: true,
		};
	}
}
