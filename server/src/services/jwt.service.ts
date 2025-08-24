import jwt from "jsonwebtoken";
import { z } from "zod";

import type { TokenDecoded } from "../types/index.js";

import { DEFAULT_JWT_CONFIG } from "../config/index.js";
import {
	type JwtBaseError,
	JwtInvalidPayloadError,
	JwtInvalidTokenError,
} from "../errors/index.js";
import { type JwtConfig, type Result, TokenType } from "../types/index.js";
import { jwtTokenValidator } from "../validators/jwt-token.validator.js";

export interface IJwtService {}

type JwtResult<T> = Result<T, JwtBaseError>;

export class JwtService implements IJwtService {
	private readonly _config: JwtConfig;
	private readonly _provider: typeof jwt;

	constructor(
		config: JwtConfig = DEFAULT_JWT_CONFIG,
		provider: typeof jwt = jwt,
	) {
		this._config = config;
		this._provider = provider;
	}

	private _extractExpirationDateFromToken(token: string): JwtResult<Date> {
		const decoded = this._provider.decode(token);

		if (!decoded || typeof decoded !== "object") {
			return {
				error: new JwtInvalidTokenError({
					decodedTokenType: "string",
					expectedType: "object",
				}),
				success: false,
			};
		}

		if (!decoded.exp || typeof decoded.exp !== "number") {
			return {
				error: new JwtInvalidTokenError({
					expected: "exp",
				}),
				success: false,
			};
		}

		return {
			data: new Date(decoded.exp * 1000),
			success: true,
		};
	}

	private _getExpirationTimeByTokenType(tokenType: TokenType): number {
		return tokenType === TokenType.ACCESS
			? this._config.accessTokenExpiresIn
			: this._config.refreshTokenExpiresIn;
	}

	private _getSecretByTokenType(tokenType: TokenType): string {
		return tokenType === TokenType.ACCESS
			? this._config.accessTokenSecret
			: this._config.refreshTokenSecret;
	}

	private _validateExpectedType(expectedType: TokenType): JwtResult<TokenType> {
		const result = z
			.nativeEnum(TokenType, {
				message: "Invalid token type",
			})
			.safeParse(expectedType);

		if (!result.success) {
			return {
				error: new JwtInvalidPayloadError({
					cause: result.error,
					invalidTokenType: expectedType,
				}),
				success: false,
			};
		}
		return {
			data: expectedType,
			success: true,
		};
	}

	private _validateToken(token: string): JwtResult<string> {
		const result = jwtTokenValidator.safeParse(token);

		if (!result.success) {
			return {
				error: new JwtInvalidTokenError({ cause: result.error }),
				success: false,
			};
		}
		return {
			data: token,
			success: true,
		};
	}

	private _validateTokenType(
		expectedType: TokenType,
		decodedToken: TokenDecoded,
	): JwtResult<void> {
		if (decodedToken.type !== expectedType) {
			return {
				error: new JwtInvalidPayloadError({
					decodedTokenType: decodedToken.type,
					expectedType,
				}),
				success: false,
			};
		}
		return {
			data: undefined,
			success: true,
		};
	}

	private _validateUserId(userId: string): JwtResult<string> {
		const result = z
			.string()
			.trim()
			.min(1, "User ID is required")
			.safeParse(userId);

		if (!result.success) {
			return {
				error: new JwtInvalidPayloadError({ cause: result.error }),
				success: false,
			};
		}
		return {
			data: userId,
			success: true,
		};
	}
}
