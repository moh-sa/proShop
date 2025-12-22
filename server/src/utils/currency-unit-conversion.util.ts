import { getCurrencyFactor } from "./get-currency-factor.util.js";
import { validateNumber } from "./validate-number.util.js";

/**
 * Converts a currency amount to its smallest unit (e.g., dollars to cents)
 * @example
 * ```
 * toCurrencySmallestUnit({
 * 	amount: 19.99,
 * 	currency: 'USD',
 * }) // → 1999
 * ```
 */
export function toCurrencySmallestUnit(params: {
	amount: number;
	currency: string;
}): number {
	const amount = validateNumber(params.amount);
	const factor = getCurrencyFactor(params.currency);

	return Math.round(amount * factor);
}

/**
 * Converts from smallest currency unit to normal unit (e.g., cents to dollars)
 * @example
 * ```
 * fromCurrencySmallestUnit({
 * 	amount: 1999,
 * 	currency: "USD",
 * }) // → 19.99
 * ```
 */

export function fromCurrencySmallestUnit(params: {
	amount: number;
	currency: string;
}): number {
	const amount = validateNumber(params.amount);
	const factor = getCurrencyFactor(params.currency);

	return amount / factor;
}
