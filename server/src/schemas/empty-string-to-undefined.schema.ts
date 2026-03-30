import z from "zod";

/**
 * Treats empty strings as `undefined`.
 *
 * @example
 * parse("")    // => undefined
 * parse("   ") // => undefined
 * parse("abc") // => "abc"
 */
export const emptyStringToUndefinedSchema = z.preprocess(
	(v) => (typeof v === "string" && v.trim().length === 0 ? undefined : v),
	// `optional` is required even if the main schema is using `partial`
	z.string().trim().optional(),
);
