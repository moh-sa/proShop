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
import { formatZodErrors } from "../utils/index.js";
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

	constructor(provider: typeof argon = argon) {
		this._provider = provider;
	}

	public async hash(
		args: MethodParams<IPasswordService, "hash">,
	): MethodReturn<IPasswordService, "hash"> {
		const validationResult = this._validateForHash(args.password);
		if (!validationResult.success) {
			return validationResult;
		}

		try {
			const hashResult = await this._provider.hash(args.password);
			return {
				data: hashResult,
				success: true,
			};
		} catch (error) {
			return {
				error: new PasswordHashError({ cause: error }),
				success: false,
			};
		}
	}

	public async verify(
		args: MethodParams<IPasswordService, "verify">,
	): MethodReturn<IPasswordService, "verify"> {
		const validationResult = this._validateForVerify(
			args.hashedPassword,
			args.password,
		);
		if (!validationResult.success) {
			return validationResult;
		}

		try {
			const verificationResult = await this._provider.verify(
				args.hashedPassword,
				args.password,
			);
			if (!verificationResult) {
				return {
					error: new PasswordVerifyError({
						cause: new Error("Invalid password"),
					}),
					success: false,
				};
			}

			return {
				data: undefined,
				success: true,
			};
		} catch (error) {
			return {
				error: new PasswordVerifyError({ cause: error }),
				success: false,
			};
		}
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
