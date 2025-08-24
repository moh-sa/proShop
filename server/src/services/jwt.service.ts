import jwt from "jsonwebtoken";
import { z } from "zod";

import type { JwtConfig, Result } from "../types/index.js";

import { DEFAULT_JWT_CONFIG } from "../config/index.js";
import { type JwtBaseError, JwtInvalidPayloadError } from "../errors/index.js";

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
