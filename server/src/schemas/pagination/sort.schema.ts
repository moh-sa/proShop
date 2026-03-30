import z from "zod";

/**
 * Builds a `sort` schema from the passed keys.
 *
 * @param allowedKeys z.enum of fields that can be used for sorting.
 * @returns parsed sort object or undefined
 * @example
 * ```
 * const sortableFields = z.enum(["createdAt", "total"]);
 * // or get z.enum from a z.object
 * const sortableFields = z.object({...}).keyof();
 *
 * createPaginationSortSchema(sortableFields)
 * .parse("createdAt:desc,total:asc");
 * // => { createdAt: "desc", total: "asc" }
 *
 * createPaginationSortSchema(sortableFields).parse(undefined);
 * // => undefined
 * ```
 */
export function createPaginationSortSchema<
	T extends z.ZodEnum<{ [key: string]: string }>,
>(allowedKeys: T) {
	const sortDir = z.enum(["asc", "desc"]);
	const sortObjectSchema = z
		.partialRecord(allowedKeys, sortDir)
		.refine((obj) => Object.keys(obj).length > 0, {
			error: "Sort must contain at least one field",
		});

	return z
		.string()
		.trim()
		.refine(isValidSortFormat, {
			error: "Invalid sort string format",
			path: ["sort"],
		})
		.pipe(z.transform(parseSortString))
		.pipe(sortObjectSchema)
		.optional();
}

/**
 * Checks if a sort string matches `field:direction` pairs.
 */
function isValidSortFormat(input: string) {
	const pairs = input.split(",");
	const pattern = /^(\w+) *: *(asc|desc)$/;

	for (const pair of pairs) {
		const match = pair.trim().match(pattern);
		if (!match) {
			return false;
		}
	}

	return true;
}

/**
 * Converts a sort string into a sort object.
 */
function parseSortString(input: string) {
	const result: Partial<Record<string, "asc" | "desc">> = {};
	const pairs = input.split(",");

	for (const pair of pairs) {
		const [field, direction] = pair.split(":");
		result[field.trim()] = direction.trim() as "asc" | "desc";
	}
	return result;
}
