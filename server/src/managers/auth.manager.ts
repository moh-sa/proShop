import type {
	IJwtService,
	IPasswordService,
	ISessionService,
	IUserService,
} from "../services/index.js";
import type { Result, SelectUser, TokenPair } from "../types/index.js";

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
interface IAuthManager {}

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
