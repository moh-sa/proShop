import { InternalError, ValidationError } from "../errors/index.js";

/**
 * Gets the currency factor based on decimal places (USD=100, JPY=1).
 */
export function getCurrencyFactor(currency: string): number {
	try {
		const formatter = new Intl.NumberFormat("en", {
			currency,
			style: "currency",
		});

		const { maximumFractionDigits } = formatter.resolvedOptions();
		if (maximumFractionDigits === undefined) {
			throw new ValidationError(
				`Unable to get maximum fraction digits for currency: ${currency}`,
			);
		}

		return Math.pow(10, maximumFractionDigits);
	} catch (error) {
		if (error instanceof RangeError) {
			throw new ValidationError("Invalid currency code", { currency });
		}

		if (error instanceof ValidationError) {
			throw error;
		}

		throw new InternalError(
			"An unexpected error occurred while getting the currency factor",
			{
				currency,
				error,
			},
		);
	}
}
