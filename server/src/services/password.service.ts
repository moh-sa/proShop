import * as argon from "argon2";
import { z } from "zod";

import type { PasswordBaseError } from "../errors/index.js";
import type {
	FailureResult,
	MethodParams,
	MethodReturn,
	Result,
} from "../types/index.js";

import {
	PasswordHashError,
	PasswordValidationError,
	PasswordVerifyError,
} from "../errors/index.js";
import { formatZodErrors, getLoggerFromContext } from "../utils/index.js";
import { passwordValidator } from "../validators/index.js";

export interface IPasswordService {
	hash(args: { password: string }): Promise<PswResult<string>>;
	verify(args: {
		hashedPassword: string;
		password: string;
	}): Promise<PswResult<undefined>>;
}

type PswResult<T> = Result<T, PasswordBaseError>;

export class PasswordService implements IPasswordService {
	private readonly _provider: typeof argon;

	constructor(provider?: typeof argon) {
		this._provider = provider ?? argon;
	}

	public async hash(
		args: MethodParams<IPasswordService, "hash">,
	): MethodReturn<IPasswordService, "hash"> {
		const logger = this._getLogger({ method: "hash" });
		logger.debug({ password: args.password }, "Hashing password");

		const validationResult = this._validateForHash(args.password);
		if (!validationResult.success) {
			logger.warn(
				{ error: validationResult.error },
				"Password zod validation failed",
			);
			return validationResult;
		}

		try {
			const hashResult = await this._provider.hash(args.password);

			logger.info("Password hashed successfully");

			return {
				data: hashResult,
				success: true,
			};
		} catch (error) {
			logger.error(
				{ error },
				"Unexpected error occurred while hashing password",
			);
			return {
				error: new PasswordHashError({ cause: error }),
				success: false,
			};
		}
	}

	public async verify(
		args: MethodParams<IPasswordService, "verify">,
	): MethodReturn<IPasswordService, "verify"> {
		const logger = this._getLogger({ method: "verify" });
		logger.debug(
			{ hashedPassword: args.hashedPassword, password: args.password },
			"Verifying password",
		);

		const validationResult = this._validateForVerify(
			args.hashedPassword,
			args.password,
		);
		if (!validationResult.success) {
			logger.warn(
				{ error: validationResult.error },
				"Password zod validation failed",
			);
			return validationResult;
		}

		try {
			const verificationResult = await this._provider.verify(
				args.hashedPassword,
				args.password,
			);
			if (!verificationResult) {
				logger.warn("Invalid password");
				return {
					error: new PasswordVerifyError({
						cause: new Error("Invalid password"),
					}),
					success: false,
				};
			}

			logger.info("Password verified successfully");
			return {
				data: undefined,
				success: true,
			};
		} catch (error) {
			logger.error(
				{ error },
				"Unexpected error occurred while verifying password",
			);
			return {
				error: new PasswordVerifyError({ cause: error }),
				success: false,
			};
		}
	}

	private _getLogger(args: { [key: string]: unknown; method: string }) {
		return getLoggerFromContext().child({ layer: "password service", ...args });
	}

	private _handleValidationError(
		error: z.ZodError,
	): FailureResult<PasswordBaseError> {
		const message = formatZodErrors(error);
		return {
			error: new PasswordValidationError(message, { cause: error }),
			success: false,
		};
	}

	private _validateForHash(password: string): PswResult<undefined> {
		const result = passwordValidator.safeParse(password);
		if (!result.success) {
			return this._handleValidationError(result.error);
		}

		return {
			data: undefined,
			success: true,
		};
	}

	private _validateForVerify(
		hashedPassword: string,
		password: string,
	): PswResult<undefined> {
		const result = z
			.object({
				hashedPassword: z
					.string()
					.trim()
					.min(1, "Hashed password cannot be empty"),
				password: passwordValidator,
			})
			.safeParse({ hashedPassword, password });
		if (!result.success) {
			return this._handleValidationError(result.error);
		}

		return {
			data: undefined,
			success: true,
		};
	}
}
