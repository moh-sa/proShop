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
import { JwtVerificationError } from "../errors/jwt/jwt-verification.error.js";
import { type JwtConfig, type Result, TokenType } from "../types/index.js";
import { jwtTokenValidator } from "../validators/jwt-token.validator.js";

export interface IJwtService {
	generateAccessToken(args: { userId: string }): JwtResult<TokenResult>;
	generateRefreshToken(args: { userId: string }): JwtResult<TokenResult>;
	generateTokenPair(args: { userId: string }): JwtResult<TokenPair>;
	refreshAccessToken(args: { refreshToken: string }): JwtResult<TokenResult>;
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
				accessToken: accessTokenResult.data,
				refreshToken: refreshTokenResult.data,
			},
			success: true,
		};
	}

	public refreshAccessToken(args: {
		refreshToken: string;
	}): JwtResult<TokenResult> {
		const refreshTokenResult = this.verify({
			expectedType: TokenType.REFRESH,
			token: args.refreshToken,
		});
		if (!refreshTokenResult.success) {
			return refreshTokenResult;
		}

		return this.generateAccessToken({
			userId: refreshTokenResult.data.userId,
		});
	}

	public verify(args: {
		expectedType: TokenType;
		token: string;
	}): JwtResult<TokenDecoded> {
		const tokenResult = this._validateToken(args.token);
		if (!tokenResult.success) {
			return tokenResult;
		}

		const expectedTypeResult = this._validateExpectedType(args.expectedType);
		if (!expectedTypeResult.success) {
			return expectedTypeResult;
		}

		const secret = this._getSecretByTokenType(args.expectedType);

		const decoded = this._verifyToken(args.token, secret);
		if (!decoded.success) {
			return decoded;
		}

		const expectedTokenTypeResult = this._validateTokenType(
			args.expectedType,
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

		try {
			const token = this._provider.sign(args.payload, secret, {
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
