import { ValidationError } from "../errors/index.js";

/**
 * Converts input to number and validates it's not NaN.
 */
export function validateNumber(input: unknown): number {
	const amount = Number(input);
	if (Number.isNaN(amount)) {
		throw new ValidationError("Amount must be a number");
	}

	return amount;
}
