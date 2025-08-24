import jwt from "jsonwebtoken";

import type { JwtConfig } from "../types/index.js";

import { DEFAULT_JWT_CONFIG } from "../config/index.js";

export interface IJwtService {}

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
}
