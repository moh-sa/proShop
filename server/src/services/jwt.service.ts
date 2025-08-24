import jwt from "jsonwebtoken";
import { z } from "zod";

import { DEFAULT_JWT_CONFIG } from "../config/index.js";
import { type JwtBaseError, JwtInvalidPayloadError } from "../errors/index.js";
import { type JwtConfig, type Result, TokenType } from "../types/index.js";

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
