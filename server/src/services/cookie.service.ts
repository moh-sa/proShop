import type { CookieBaseError } from "../errors/index.js";
import type { CookieConfig, Result } from "../types/index.js";

import { DEFAULT_COOKIE_CONFIG } from "../config/index.js";

export interface ICookieService {}

type CookieResult<T> = Result<T, CookieBaseError>;

export class CookieService implements ICookieService {
	private readonly _config: CookieConfig;

	constructor(config?: CookieConfig) {
		this._config = config ?? DEFAULT_COOKIE_CONFIG;
	}
}
