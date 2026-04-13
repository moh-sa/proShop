import type { Request, Response } from "express";
import type { z } from "zod";

import { DEFAULT_COOKIE_CONFIG } from "../config/index.js";
import type { CookieBaseError } from "../errors/index.js";
import {
	CookieNotFoundError,
	CookieOperationError,
	CookieSerializationError,
	CookieValidationError,
} from "../errors/index.js";
import { cookieNameSchema } from "../schemas/index.js";
import type {
	CookieConfig,
	CookieItem,
	CookieItemOptions,
	CookieName,
	MethodParams,
	MethodReturn,
	Result,
} from "../types/index.js";
import { getLoggerFromContext } from "../utils/index.js";

export interface ICookieService {
	delete(args: {
		name: CookieName;
		response: Response;
	}): CookieResult<undefined>;

	get<T>(args: {
		name: CookieName;
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

	public delete(
		args: MethodParams<ICookieService, "delete">,
	): MethodReturn<ICookieService, "delete"> {
		const logger = this._getLogger({ method: "delete" });

		logger.debug({ name: args.name }, "Deleting cookie");

		const nameValidationResult = this._validateName(args.name);
		if (!nameValidationResult.success) {
			logger.warn(
				{ error: nameValidationResult.error, name: args.name },
				"Invalid cookie name",
			);
			return nameValidationResult;
		}
		logger.debug({ name: args.name }, "Validated cookie name");

		const resResult = this._validateResponse(args.response);
		if (!resResult.success) {
			logger.warn(
				{ error: resResult.error, response: args.response },
				"Invalid response object",
			);
			return resResult;
		}
		logger.debug("Validated response object");

		const options: CookieItemOptions = this._mergeOptions({
			expires: new Date(0),
		});

		logger.debug({ options }, "Merged options");

		const deleteResult = this._deleteCookie({
			name: args.name,
			options,
			response: args.response,
		});
		if (!deleteResult.success) {
			logger.error(
				{ error: deleteResult.error, name: args.name },
				"Failed to delete cookie",
			);
			return deleteResult;
		}

		logger.info({ name: args.name }, "Cookie deleted successfully");

		return deleteResult;
	}

	public get<T>(args: {
		name: CookieName;
		request: Request;
		schema?: z.ZodSchema<T>;
	}): CookieResult<T> {
		const logger = this._getLogger({ method: "get" });
		logger.debug({ name: args.name }, "Getting cookie");

		const nameValidationResult = this._validateName(args.name);
		if (!nameValidationResult.success) {
			logger.warn(
				{ error: nameValidationResult.error, name: args.name },
				"Invalid cookie name",
			);
			return nameValidationResult;
		}

		const reqResult = this._validateRequest(args.request);
		if (!reqResult.success) {
			logger.warn(
				{ error: reqResult.error, request: args.request },
				"Invalid request object",
			);
			return reqResult;
		}

		const cookieResult = this._getCookie(args.request, args.name);
		if (!cookieResult.success) {
			logger.warn(
				{ error: cookieResult.error, name: args.name },
				"Cookie not found",
			);
			return cookieResult;
		}

		const parsedCookieResult = this._parseValue<T>(cookieResult.data);
		if (!parsedCookieResult.success) {
			logger.warn(
				{ error: parsedCookieResult.error, name: args.name },
				"Failed to parse cookie value",
			);
			return parsedCookieResult;
		}

		logger.debug({ parsedCookieResult }, "Parsed cookie value");

		if (args.schema) {
			const validationResult = args.schema.safeParse(parsedCookieResult.data);
			if (!validationResult.success) {
				logger.warn(
					{ error: validationResult.error, name: args.name },
					"Failed to validate cookie value",
				);
				return {
					error: CookieValidationError.schemaValidationFailed(
						args.name,
						validationResult.error,
					),
					success: false,
				};
			}

			logger.info({ name: args.name }, "Cookie value validated successfully");

			return {
				data: validationResult.data,
				success: true,
			};
		}

		logger.info({ name: args.name }, "Got cookie successfully");

		return parsedCookieResult;
	}

	public set(
		args: MethodParams<ICookieService, "set">,
	): MethodReturn<ICookieService, "set"> {
		const logger = this._getLogger({ method: "set" });
		logger.debug({ item: args.item }, "Setting cookie");

		const nameValidationResult = this._validateName(args.item.name);
		if (!nameValidationResult.success) {
			logger.warn(
				{ error: nameValidationResult.error, item: args.item },
				"Invalid cookie name",
			);
			return nameValidationResult;
		}

		logger.debug({ item: args.item }, "Validated cookie name");

		const resResult = this._validateResponse(args.response);
		if (!resResult.success) {
			logger.warn(
				{ error: resResult.error, response: args.response },
				"Invalid response object",
			);
			return resResult;
		}

		logger.debug("Validated response object");

		const options = this._mergeOptions(args.options);

		logger.debug({ options }, "Merged options");

		const valueResult = this._stringifyValue(args.item.value);
		if (!valueResult.success) {
			logger.warn(
				{ error: valueResult.error, item: args.item },
				"Failed to stringify cookie value",
			);
			return valueResult;
		}

		logger.debug({ valueResult }, "Stringified cookie value");

		const setResult = this._setCookie({
			name: args.item.name,
			options,
			response: args.response,
			value: valueResult.data,
		});
		if (!setResult.success) {
			logger.warn(
				{ error: setResult.error, item: args.item },
				"Failed to set cookie",
			);
			return setResult;
		}

		logger.info({ item: args.item }, "Cookie set successfully");

		return setResult;
	}

	private _deleteCookie(args: {
		name: string;
		options: CookieItemOptions;
		response: Response;
	}): CookieResult<undefined> {
		// Express v5 ignores expires and maxAge in clearCookie method
		const { expires: _expires, maxAge: _maxAge, ...options } = args.options;
		try {
			args.response.clearCookie(args.name, options);

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

	private _getLogger(args: { [key: string]: unknown; method: string }) {
		return getLoggerFromContext().child({
			layer: "cookie service",
			...args,
		});
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

	private _validateName(name: CookieName): CookieResult<undefined> {
		const result = cookieNameSchema.safeParse(name);
		if (!result.success) {
			return {
				error: CookieValidationError.invalidName(name),
				success: false,
			};
		}

		return {
			data: undefined,
			success: true,
		};
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
}

export const cookieService = new CookieService();
