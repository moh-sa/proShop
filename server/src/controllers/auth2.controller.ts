import type { Request, Response } from "express";

import type { IAuthManager } from "../managers/index.js";
import type { ICookieService } from "../services/index.js";
import type { TokenPair } from "../types/jwt.type.js";

import { CookieName } from "../constants/index.js";
import { AuthManager } from "../managers/index.js";
import { CookieService } from "../services/index.js";
import { jwtTokenValidator } from "../validators/index.js";

/**
 * Authentication Controller (v2) Interface
 * @remarks The v1 Auth controller is being deprecated soon.
 */
export interface IAuth2Controller {}

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
