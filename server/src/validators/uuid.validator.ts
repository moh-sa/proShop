import { z } from "zod";

export const uuidValidator = (fieldName: string) =>
	z
		.string()
		.trim()
		.pipe(z.uuid({ error: `Invalid ${fieldName} format.` }));
