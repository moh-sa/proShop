import * as argon from "argon2";
import { z } from "zod";

import { PasswordValidationError } from "../errors/index.js";
import { formatZodErrors } from "../utils/index.js";
import { passwordValidator } from "../validators/index.js";

export interface IPasswordService {}

export class PasswordService implements IPasswordService {
	private readonly _provider: typeof argon;

	constructor(provider: typeof argon = argon) {
		this._provider = provider;
	}

	private _validate(args: { hashedPassword?: string; password: string }): void {
		const result = z
			.object({
				hashedPassword: z
					.string()
					.trim()
					.min(1, "Hashed password cannot be empty")
					.optional(),
				password: passwordValidator,
			})
			.safeParse(args);

		if (!result.success) {
			const message = formatZodErrors(result.error);
			throw new PasswordValidationError(message, { cause: result.error });
		}

		return;
	}
}
