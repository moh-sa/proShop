/**
 * Formats a date into a readable `DD Mon YYYY` string.
 */
export function formatDate(input: string | Date | number): string {
	const date = input instanceof Date ? input : new Date(input);

	return date
		.toLocaleDateString("en-GB", {
			year: "numeric",
			month: "short",
			day: "numeric",
		})
		.replace(",", "");
}
