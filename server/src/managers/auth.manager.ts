import type {
	IJwtService,
	IPasswordService,
	ISessionService,
	IUserService,
} from "../services/index.js";
import type {
	InsertUser,
	Result,
	SelectUser,
	TokenPair,
} from "../types/index.js";

import { ConflictError, ValidationError } from "../errors/index.js";
import {
	JwtService,
	PasswordService,
	SessionService,
	UserService,
} from "../services/index.js";

// helpers types
type AuthResult<T> = Result<T>;
type Params<T extends keyof IAuthManager> = Parameters<IAuthManager[T]>[0];
type Return<T extends keyof IAuthManager> = ReturnType<IAuthManager[T]>;

// interfaces
interface IAuthManager {
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

	public async signUp(args: Params<"signUp">): Return<"signUp"> {
		if (!args?.email || !args?.password) {
			return {
				error: new ValidationError("Email and password are required"),
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
