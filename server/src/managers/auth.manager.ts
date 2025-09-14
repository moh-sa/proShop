import { Types } from "mongoose";

import type {
	IJwtService,
	IPasswordService,
	ISessionService,
	IUserService,
} from "../services/index.js";
import type { SelectSession } from "../types/index.js";

import {
	ConflictError,
	InvalidCredentialsError,
	NotFoundError,
	ValidationError,
} from "../errors/index.js";
import {
	JwtService,
	PasswordService,
	SessionService,
	UserService,
} from "../services/index.js";
import {
	type InsertUser,
	type Result,
	type SelectUser,
	type TokenPair,
	TokenType,
} from "../types/index.js";

// helpers types
type AuthResult<T> = Result<T>;
type Params<T extends keyof IAuthManager> = Parameters<IAuthManager[T]>[0];
type Return<T extends keyof IAuthManager> = ReturnType<IAuthManager[T]>;

// interfaces
export interface IAuthManager {
	getUserSessions(args: {
		userId: string;
	}): Promise<AuthResult<Array<SelectSession>>>;

	refreshAccessToken(args: { refreshToken: string }): Promise<
		AuthResult<{
			accessToken: string;
			user: SelectUser;
		}>
	>;

	revokeSession(args: {
		tokenId: string;
		userId: string;
	}): Promise<AuthResult<undefined>>;

	signIn(args: Pick<InsertUser, "email" | "password">): Promise<
		AuthResult<{
			sessionId: string;
			tokens: TokenPair;
			user: SelectUser;
		}>
	>;

	signOut(args: { refreshToken: string }): Promise<AuthResult<undefined>>;

	signOutAll(args: { userId: string }): Promise<AuthResult<number>>;

	signUp(args: InsertUser): Promise<
		AuthResult<{
			sessionId: string;
			tokens: TokenPair;
			user: SelectUser;
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
		args: Params<"getUserSessions">,
	): Return<"getUserSessions"> {
		if (!args?.userId) {
			return {
				error: new ValidationError("User ID is required"),
				success: false,
			};
		}

		const result = await this._session.getActiveByUserId({
			userId: args.userId,
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
		args: Params<"refreshAccessToken">,
	): Return<"refreshAccessToken"> {
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

		const userResult = await this._user.getById_UNSAFE({
			userId: new Types.ObjectId(tokenValidationResult.data.userId),
		});
		if (!userResult) {
			return {
				error: new NotFoundError("User"),
				success: false,
			};
		}

		const accessTokenResult = this._jwt.generateAccessToken({
			userId: tokenValidationResult.data.userId,
		});
		if (!accessTokenResult.success) {
			return accessTokenResult;
		}

		return {
			data: {
				accessToken: accessTokenResult.data.token,
				user: userResult,
			},
			success: true,
		};
	}

	public async revokeSession(
		args: Params<"revokeSession">,
	): Return<"revokeSession"> {
		if (!args?.tokenId || !args?.userId) {
			return {
				error: new ValidationError("Token ID and user ID are required"),
				success: false,
			};
		}

		const result = await this._session.revokeByTokenIdAndUserId({
			tokenId: args.tokenId,
			userId: args.userId,
		});
		if (!result.success) {
			return result;
		}

		return {
			data: undefined,
			success: true,
		};
	}

	public async signIn(args: Params<"signIn">): Return<"signIn"> {
		if (!args?.email || !args?.password) {
			return {
				error: new ValidationError("Email and password are required"),
				success: false,
			};
		}

		const user = await this._user.getByEmail_UNSAFE({ email: args.email });
		if (!user) {
			return {
				error: new InvalidCredentialsError("Invalid email or password"),
				success: false,
			};
		}

		const isPasswordValid = await this._password.verify({
			hashedPassword: user.password,
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

		return this._createAuthSession(user);
	}

	public async signOut(args: Params<"signOut">): Return<"signOut"> {
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

	public async signOutAll(args: Params<"signOutAll">): Return<"signOutAll"> {
		if (!args?.userId) {
			return {
				error: new ValidationError("User ID is required"),
				success: false,
			};
		}

		const result = await this._session.deleteAllByUserId({
			userId: args.userId,
		});
		if (!result.success) {
			return result;
		}

		return {
			data: result.data,
			success: true,
		};
	}

	public async signUp(args: Params<"signUp">): Return<"signUp"> {
		if (!args?.email || !args?.password || !args?.name) {
			return {
				error: new ValidationError("Email, password and name are required"),
				success: false,
			};
		}

		const isUserExists = await this._user.existsByEmail({ email: args.email });
		if (isUserExists) {
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

		const createdUser = await this._user.create_UNSAFE({
			...args,
			password: hashedPasswordResult.data,
		});

		return this._createAuthSession(createdUser);
	}

	private async _createAuthSession(user: SelectUser): Promise<
		AuthResult<{
			sessionId: string;
			tokens: TokenPair;
			user: SelectUser;
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
