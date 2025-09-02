import type { Response } from "express";

import type {
	CookieConfig,
	CookieItemOptions,
	Result,
} from "../types/index.js";

import { DEFAULT_COOKIE_CONFIG } from "../config/index.js";
import {
	type CookieBaseError,
	CookieValidationError,
} from "../errors/index.js";

export interface ICookieService {}

type CookieResult<T> = Result<T, CookieBaseError>;

export class CookieService implements ICookieService {
	private readonly _config: CookieConfig;

	constructor(config?: CookieConfig) {
		this._config = config ?? DEFAULT_COOKIE_CONFIG;
	}

	private _mergeOptions(options?: CookieItemOptions) {
		return {
			...this._config,
			...options,
		};
	}

	private _validateResponse(res: Response): CookieResult<undefined> {
		if (!res || typeof res !== "object" || !res.cookie || !res.clearCookie) {
			return {
				error: CookieValidationError.invalidResponse(),
				success: false,
			};
		}

		return {
			data: undefined,
			success: true,
		};
	}

	private _validateStringExists(
		field: string,
		val: unknown,
	): CookieResult<undefined> {
		if (!val) {
			return {
				error: field.toLowerCase().includes("name")
					? CookieValidationError.emptyName()
					: CookieValidationError.emptyValue(),
				success: false,
			};
		}

		if (typeof val !== "string") {
			return {
				error: field.toLowerCase().includes("name")
					? CookieValidationError.invalidName(String(val))
					: CookieValidationError.invalidValue(val),
				success: false,
			};
		}

		if (!val.trim()) {
			return {
				error: field.toLowerCase().includes("name")
					? CookieValidationError.emptyName()
					: CookieValidationError.emptyValue(),
				success: false,
			};
		}

		return {
			data: undefined,
			success: true,
		};
	}
}
