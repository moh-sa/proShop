import { z } from "zod";

export const stringToStrictBooleanValidator = z.preprocess((val) => {
	if (!val || typeof val !== "string") {
		return val;
	}
	const trimmed = val.trim();
	if (trimmed === "true") {
		return true;
	}
	if (trimmed === "false") {
		return false;
	}
	return undefined;
}, z.boolean());
