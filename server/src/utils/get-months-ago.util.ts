export function getMonthsAgo(count: number): Date {
	const date = new Date();
	date.setDate(1);
	date.setMonth(date.getMonth() - (count - 1));
	date.setHours(0, 0, 0, 0);
	return date;
}
