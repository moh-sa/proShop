export function isOlderThan24Hours(date: Date | string | number): boolean {
	const inputDate = new Date(date);

	if (isNaN(inputDate.getTime())) {
		throw new Error("Invalid date provided");
	}

	const now = new Date();
	const diffInMs = now.getTime() - inputDate.getTime();

	const TWENTY_FOUR_HOURS_IN_MS = 24 * 60 * 60 * 1000;

	return diffInMs > TWENTY_FOUR_HOURS_IN_MS;
}
