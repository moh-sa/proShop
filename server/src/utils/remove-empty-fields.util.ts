/**
 * Remove empty fields from an object
 * @param data - The object to remove empty fields from
 * @returns The object with empty fields removed
 * @example
 * removeEmptyFields({
 *     name: "John",
 *     age: 30,
 *     city: "",
 *     country: undefined,
 * }); // { name: "John", age: 30 }
 */
export function removeEmptyFields(
	data: Record<string, unknown>,
): Record<string, unknown> {
	if (typeof data !== "object" || data === null) {
		return {};
	}

	return Object.fromEntries(
		Object.entries(data).filter(
			([_, value]) => value !== "" && value !== undefined,
		),
	);
}
