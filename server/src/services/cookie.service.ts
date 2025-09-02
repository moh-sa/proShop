import type { Request, Response } from "express";
import type { z } from "zod";

import type {
	CookieConfig,
	CookieItem,
	CookieItemOptions,
	Result,
} from "../types/index.js";

import { DEFAULT_COOKIE_CONFIG } from "../config/index.js";
import {
	type CookieBaseError,
	CookieNotFoundError,
	CookieOperationError,
	CookieSerializationError,
	CookieValidationError,
} from "../errors/index.js";

export interface ICookieService {
	get<T>(args: {
		name: string;
		request: Request;
		schema?: z.ZodSchema<T>;
	}): CookieResult<T>;

	set(args: {
		item: CookieItem;
		options?: CookieItemOptions;
		response: Response;
	}): CookieResult<undefined>;
}

type CookieResult<T> = Result<T, CookieBaseError>;

export class CookieService implements ICookieService {
	private readonly _config: CookieConfig;

	constructor(config?: CookieConfig) {
		this._config = config ?? DEFAULT_COOKIE_CONFIG;
	}

	public get<T>(args: {
		name: string;
		request: Request;
		schema?: z.ZodSchema<T>;
	}): CookieResult<T> {
		const nameResult = this._validateStringExists("Cookie Name", args.name);
		if (!nameResult.success) {
			return nameResult;
		}

		const reqResult = this._validateRequest(args.request);
		if (!reqResult.success) {
			return reqResult;
		}

		const cookieResult = this._getCookie(args.request, args.name);
		if (!cookieResult.success) {
			return cookieResult;
		}

		const parsedCookieResult = this._parseValue<T>(cookieResult.data);
		if (!parsedCookieResult.success) {
			return parsedCookieResult;
		}

		if (args.schema) {
			const validationResult = args.schema.safeParse(parsedCookieResult.data);
			if (!validationResult.success) {
				return {
					error: CookieValidationError.schemaValidationFailed(
						args.name,
						validationResult.error,
					),
					success: false,
				};
			}

			return {
				data: validationResult.data,
				success: true,
			};
		}

		return parsedCookieResult;
	}

	public set(args: {
		item: CookieItem;
		options?: CookieItemOptions;
		response: Response;
	}): CookieResult<undefined> {
		const nameResult = this._validateStringExists(
			"Cookie name",
			args.item.name,
		);
		if (!nameResult.success) {
			return nameResult;
		}

		const resResult = this._validateResponse(args.response);
		if (!resResult.success) {
			return resResult;
		}

		const options = this._mergeOptions(args.options);

		const valueResult = this._stringifyValue(args.item.value);
		if (!valueResult.success) {
			return valueResult;
		}

		return this._setCookie({
			name: args.item.name,
			options,
			response: args.response,
			value: valueResult.data,
		});
	}

	private _deleteCookie(args: {
		name: string;
		options: CookieItemOptions;
		response: Response;
	}): CookieResult<undefined> {
		try {
			args.response.clearCookie(args.name, args.options);

			return {
				data: undefined,
				success: true,
			};
		} catch (error) {
			return {
				error: CookieOperationError.deleteFailed(args.name, error),
				success: false,
			};
		}
	}

	private _getCookie(req: Request, name: string): CookieResult<string> {
		try {
			const cookie = req.signedCookies[name] ?? null;
			if (!cookie) {
				return {
					error: CookieNotFoundError.byName(name),
					success: false,
				};
			}

			return {
				data: cookie,
				success: true,
			};
		} catch (error) {
			return {
				error: CookieOperationError.getFailed(name, error),
				success: false,
			};
		}
	}

	private _mergeOptions(options?: CookieItemOptions) {
		return {
			...this._config,
			...options,
		};
	}

	private _parseValue<T>(stringifiedValue: string): CookieResult<T> {
		try {
			const parsed = JSON.parse(stringifiedValue);
			return {
				data: parsed,
				success: true,
			};
		} catch (error) {
			return {
				error: CookieSerializationError.parseFailed(stringifiedValue, error),
				success: false,
			};
		}
	}

	private _setCookie(args: {
		name: string;
		options: CookieItemOptions;
		response: Response;
		value: string;
	}): CookieResult<undefined> {
		try {
			args.response.cookie(args.name, args.value, args.options);

			return {
				data: undefined,
				success: true,
			};
		} catch (error) {
			return {
				error: CookieOperationError.setFailed(args.name, error),
				success: false,
			};
		}
	}

	private _stringifyValue(value: CookieItem["value"]): CookieResult<string> {
		try {
			const stringified = JSON.stringify(value);

			return {
				data: stringified,
				success: true,
			};
		} catch (error) {
			return {
				error: CookieSerializationError.stringifyFailed(value, error),
				success: false,
			};
		}
	}

	private _validateRequest(req: Request): CookieResult<undefined> {
		if (!req || typeof req !== "object" || !req.cookies || !req.signedCookies) {
			return {
				error: CookieValidationError.invalidRequest(),
				success: false,
			};
		}

		return {
			data: undefined,
			success: true,
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
