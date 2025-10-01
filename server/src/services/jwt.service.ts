import jwt from "jsonwebtoken";
import { z } from "zod";

import type {
	TokenDecoded,
	TokenPair,
	TokenPayload,
	TokenResult,
} from "../types/index.js";

import { DEFAULT_JWT_CONFIG } from "../config/index.js";
import {
	JwtBaseError,
	JwtExpirationError,
	JwtGenerationError,
	JwtInvalidPayloadError,
	JwtInvalidTokenError,
} from "../errors/index.js";
import { tokenDecodedSchema, tokenTypeSchema } from "../schemas/index.js";
import { type JwtConfig, type Result, TokenType } from "../types/index.js";
import { jwtTokenValidator } from "../validators/jwt-token.validator.js";

export interface IJwtService {
	generateAccessToken(args: { userId: string }): JwtResult<TokenResult>;
	generateRefreshToken(args: { userId: string }): JwtResult<TokenResult>;
	generateTokenPair(args: { userId: string }): JwtResult<TokenPair>;
	refreshAccessToken(args: { refreshToken: string }): JwtResult<{
		access: TokenResult;
		decodedRefreshToken: TokenDecoded;
	}>;
	verify(args: {
		expectedType: TokenType;
		token: string;
	}): JwtResult<TokenDecoded>;
}

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

	public generateAccessToken(args: { userId: string }): JwtResult<TokenResult> {
		return this._generateToken({
			payload: {
				type: TokenType.ACCESS,
				userId: args.userId,
			},
		});
	}

	public generateRefreshToken(args: {
		userId: string;
	}): JwtResult<TokenResult> {
		return this._generateToken({
			payload: {
				type: TokenType.REFRESH,
				userId: args.userId,
			},
		});
	}

	public generateTokenPair(args: { userId: string }): JwtResult<TokenPair> {
		const accessTokenResult = this.generateAccessToken(args);
		if (!accessTokenResult.success) {
			return accessTokenResult;
		}

		const refreshTokenResult = this.generateRefreshToken(args);
		if (!refreshTokenResult.success) {
			return refreshTokenResult;
		}

		return {
			data: {
				access: accessTokenResult.data,
				refresh: refreshTokenResult.data,
			},
			success: true,
		};
	}

	public refreshAccessToken(args: { refreshToken: string }): JwtResult<{
		access: TokenResult;
		decodedRefreshToken: TokenDecoded;
	}> {
		const refreshTokenResult = this.verify({
			expectedType: TokenType.REFRESH,
			token: args.refreshToken,
		});
		if (!refreshTokenResult.success) {
			return refreshTokenResult;
		}

		const accessTokenResult = this.generateAccessToken({
			userId: refreshTokenResult.data.userId,
		});
		if (!accessTokenResult.success) {
			return accessTokenResult;
		}

		return {
			data: {
				access: accessTokenResult.data,
				decodedRefreshToken: refreshTokenResult.data,
			},
			success: true,
		};
	}

	public verify(args: {
		expectedType: TokenType;
		token: string;
	}): JwtResult<TokenDecoded> {
		const tokenValidationResult = this._validateToken(args.token);
		if (!tokenValidationResult.success) {
			return tokenValidationResult;
		}
		const typeValidationResult = this._validateExpectedType(args.expectedType);
		if (!typeValidationResult.success) {
			return typeValidationResult;
		}

		const secret = this._getSecretByTokenType(typeValidationResult.data);

		const decoded = this._verifyToken(tokenValidationResult.data, secret);
		if (!decoded.success) {
			return decoded;
		}

		const expectedTokenTypeResult = this._validateTokenType(
			typeValidationResult.data,
			decoded.data,
		);
		if (!expectedTokenTypeResult.success) {
			return expectedTokenTypeResult;
		}

		return {
			data: decoded.data,
			success: true,
		};
	}

	private _extractExpirationDateFromToken(token: string): JwtResult<Date> {
		const decoded = this._provider.decode(token);

		const expirationDateResult = tokenDecodedSchema
			.pick({ exp: true })
			.transform((data) => new Date(data.exp * 1000))
			.safeParse(decoded);
		if (!expirationDateResult.success) {
			return {
				error: new JwtInvalidTokenError({ cause: expirationDateResult.error }),
				success: false,
			};
		}

		return {
			data: expirationDateResult.data,
			success: true,
		};
	}

	private _generateToken(args: {
		payload: TokenPayload;
	}): JwtResult<TokenResult> {
		const userIdResult = this._validateUserId(args.payload.userId);
		if (!userIdResult.success) {
			return userIdResult;
		}

		const tokenTypeResult = this._validateExpectedType(args.payload.type);
		if (!tokenTypeResult.success) {
			return tokenTypeResult;
		}

		const secret = this._getSecretByTokenType(args.payload.type);
		const expiresIn = this._getExpirationTimeByTokenType(args.payload.type);
		const tokenId = this._generateTokenId();
		const payload = {
			...args.payload,
			tokenId,
		};

		try {
			const token = this._provider.sign(payload, secret, {
				expiresIn,
			});

			const expiresAt = this._extractExpirationDateFromToken(token);
			if (!expiresAt.success) {
				return expiresAt;
			}

			return {
				data: {
					expiresAt: expiresAt.data,
					token,
					tokenId,
				},
				success: true,
			};
		} catch (error) {
			return {
				error: new JwtGenerationError({ cause: error }),
				success: false,
			};
		}
	}

	private _generateTokenId(): string {
		return crypto.randomUUID();
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
		const result = tokenTypeSchema.safeParse(expectedType);
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

	private _verifyToken(token: string, secret: string): JwtResult<TokenDecoded> {
		try {
			const decoded = this._provider.verify(token, secret);

			if (typeof decoded === "string") {
				return {
					error: new JwtInvalidTokenError({
						expectedTokenType: "object",
						receivedTokenType: "string",
					}),
					success: false,
				};
			}

			if (
				!("type" in decoded) ||
				!("userId" in decoded) ||
				!("exp" in decoded) ||
				!("tokenId" in decoded) ||
				!("iat" in decoded)
			) {
				return {
					error: new JwtInvalidTokenError({
						expected: ["type", "userId", "jti", "exp", "iat"],
						received: Object.keys(decoded),
					}),
					success: false,
				};
			}

			return {
				data: decoded as TokenDecoded,
				success: true,
			};
		} catch (error) {
			if (error instanceof jwt.TokenExpiredError) {
				return {
					error: new JwtExpirationError({ cause: error }),
					success: false,
				};
			}

			if (error instanceof jwt.JsonWebTokenError) {
				return {
					error: new JwtVerificationError({ cause: error }),
					success: false,
				};
			}

			return {
				error: new JwtBaseError(`Unknown error: ${String(error)}`),
				success: false,
			};
		}
	}
}
