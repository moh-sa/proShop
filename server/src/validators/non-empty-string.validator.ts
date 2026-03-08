import { z } from "zod";

export const nonEmptyStringValidator = (fieldName: string) =>
	z
		.string()
		.trim()
		.min(1, { error: `${fieldName} is required` });
