import jwt from "jsonwebtoken";

import type {
	MethodParams,
	MethodReturn,
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
	JwtVerificationError,
} from "../errors/index.js";
import { tokenDecodedSchema, tokenTypeSchema } from "../schemas/index.js";
import { type JwtConfig, type Result, TokenType } from "../types/index.js";
import { getLoggerFromContext } from "../utils/index.js";
import {
	jwtTokenValidator,
	objectIdStringValidator,
} from "../validators/index.js";

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

	public generateAccessToken(
		args: MethodParams<IJwtService, "generateAccessToken">,
	): MethodReturn<IJwtService, "generateAccessToken"> {
		return this._generateToken({
			payload: {
				type: TokenType.ACCESS,
				userId: args.userId,
			},
		});
	}

	public generateRefreshToken(
		args: MethodParams<IJwtService, "generateRefreshToken">,
	): MethodReturn<IJwtService, "generateRefreshToken"> {
		return this._generateToken({
			payload: {
				type: TokenType.REFRESH,
				userId: args.userId,
			},
		});
	}

	public generateTokenPair(
		args: MethodParams<IJwtService, "generateTokenPair">,
	): MethodReturn<IJwtService, "generateTokenPair"> {
		const logger = this._getLogger({ method: "generateTokenPair" });
		logger.debug({ userId: args.userId }, "Generating token pair");

		const accessTokenResult = this.generateAccessToken(args);
		if (!accessTokenResult.success) {
			return accessTokenResult;
		}

		const refreshTokenResult = this.generateRefreshToken(args);
		if (!refreshTokenResult.success) {
			return refreshTokenResult;
		}

		logger.info("Token pair generated successfully");

		return {
			data: {
				access: accessTokenResult.data,
				refresh: refreshTokenResult.data,
			},
			success: true,
		};
	}

	public refreshAccessToken(
		args: MethodParams<IJwtService, "refreshAccessToken">,
	): MethodReturn<IJwtService, "refreshAccessToken"> {
		const logger = this._getLogger({ method: "refreshAccessToken" });
		logger.debug(
			{ refreshToken: args.refreshToken },
			"Refreshing access token",
		);

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

		logger.info("Access token refreshed successfully");

		return {
			data: {
				access: accessTokenResult.data,
				decodedRefreshToken: refreshTokenResult.data,
			},
			success: true,
		};
	}

	public verify(
		args: MethodParams<IJwtService, "verify">,
	): MethodReturn<IJwtService, "verify"> {
		const logger = this._getLogger({ method: "verify" });
		logger.debug(
			{ expectedType: args.expectedType, token: args.token },
			"Verifying token",
		);

		const tokenValidationResult = this._validateToken(args.token);
		if (!tokenValidationResult.success) {
			logger.warn({ error: tokenValidationResult.error }, "Invalid token");
			return tokenValidationResult;
		}
		logger.debug({ token: tokenValidationResult.data }, "Validated token");

		const typeValidationResult = this._validateExpectedType(args.expectedType);
		if (!typeValidationResult.success) {
			logger.warn({ error: typeValidationResult.error }, "Invalid token type");
			return typeValidationResult;
		}

		logger.debug(
			{ validatedTokenType: typeValidationResult.data },
			"Validated token type",
		);

		const secret = this._getSecretByTokenType(typeValidationResult.data);
		logger.debug({ secret }, "Got secret by token type");

		const decoded = this._verifyToken(tokenValidationResult.data, secret);
		if (!decoded.success) {
			// Error already logged in _verifyToken
			return decoded;
		}

		const expectedTokenTypeResult = this._validateTokenType(
			typeValidationResult.data,
			decoded.data,
		);
		if (!expectedTokenTypeResult.success) {
			logger.warn(
				{ error: expectedTokenTypeResult.error },
				"Invalid token type",
			);
			return expectedTokenTypeResult;
		}

		logger.info(
			{ tokenId: decoded.data.tokenId, tokenType: decoded.data.type },
			"Token verified successfully",
		);

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
		const logger = this._getLogger({
			method: "_generateToken",
			tokenType: args.payload.type,
		});

		logger.debug({ payload: args.payload }, "Generating token");

		const userIdResult = this._validateUserId(args.payload.userId);
		if (!userIdResult.success) {
			logger.warn(
				{ error: userIdResult.error, payload: args.payload },
				"Invalid user ID",
			);
			return userIdResult;
		}

		logger.debug({ userId: userIdResult.data }, "Validated user ID");

		const tokenTypeResult = this._validateExpectedType(args.payload.type);
		if (!tokenTypeResult.success) {
			logger.warn({ error: tokenTypeResult.error }, "Invalid token type");
			return tokenTypeResult;
		}

		logger.debug(
			{ validatedTokenType: tokenTypeResult.data },
			"Validated token type",
		);

		const secret = this._getSecretByTokenType(tokenTypeResult.data);
		const expiresIn = this._getExpirationTimeByTokenType(tokenTypeResult.data);
		logger.debug({ expiresIn }, "Expiration time");

		const tokenId = this._generateTokenId();
		const payload = {
			tokenId,
			type: tokenTypeResult.data,
			userId: userIdResult.data,
		};
		logger.debug({ payload }, "Generated payload");

		try {
			const token = this._provider.sign(payload, secret, {
				expiresIn,
			});

			logger.debug({ token }, "Token generated");

			const expiresAt = this._extractExpirationDateFromToken(token);
			if (!expiresAt.success) {
				logger.warn(
					{ error: expiresAt.error },
					"Cannot extract expiration date from token",
				);
				return expiresAt;
			}

			logger.info("Token generated successfully");
			return {
				data: {
					expiresAt: expiresAt.data,
					token,
					tokenId,
				},
				success: true,
			};
		} catch (error) {
			logger.error({ error }, "Unexpected error while generating token");
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

	private _getLogger(args: { [key: string]: unknown; method: string }) {
		return getLoggerFromContext().child({
			layer: "jwt service",
			...args,
		});
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
		const result = objectIdStringValidator("User ID").safeParse(userId);
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
		const logger = this._getLogger({ method: "_verifyToken" });
		logger.debug({ token }, "Verifying token");

		try {
			const decoded = this._provider.verify(token, secret);
			logger.debug({ decoded }, "Decoded token");

			const decodedValidationResult = tokenDecodedSchema.safeParse(decoded);
			if (!decodedValidationResult.success) {
				logger.warn(
					{ error: decodedValidationResult.error },
					"Invalid token structure",
				);
				return {
					error: new JwtInvalidTokenError({
						cause: decodedValidationResult.error,
					}),
					success: false,
				};
			}

			logger.info(
				{
					tokenId: decodedValidationResult.data.tokenId,
					tokenType: decodedValidationResult.data.type,
				},
				"Token verified successfully",
			);
			return {
				data: decodedValidationResult.data,
				success: true,
			};
		} catch (error) {
			if (error instanceof jwt.TokenExpiredError) {
				logger.error({ error }, "Token expired");
				return {
					error: new JwtExpirationError({ cause: error }),
					success: false,
				};
			}

			if (error instanceof jwt.JsonWebTokenError) {
				logger.error({ error }, "Invalid token");
				return {
					error: new JwtVerificationError({ cause: error }),
					success: false,
				};
			}

			logger.error({ error }, "Unexpected error while verifying token");
			return {
				error: new JwtBaseError(`Unknown error: ${String(error)}`),
				success: false,
			};
		}
	}
}
