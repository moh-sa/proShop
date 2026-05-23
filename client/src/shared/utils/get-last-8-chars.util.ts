export function getLast8Chars(id: string): string {
	return id.length > 8 ? id.slice(-8) : id;
}
