/** Format a number as a USD price string, e.g. 19.99 → "$19.99" */
export function formatPrice(amount: number): string {
	return new Intl.NumberFormat("en-US", {
		style: "currency",
		currency: "USD",
	}).format(amount);
}
