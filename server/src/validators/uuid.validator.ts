import { z } from "zod";

export const uuidValidator = (fieldName: string) =>
	z
		.string()
		.trim()
		.min(1, { message: `${fieldName} is required.` })
		.uuid({ message: `Invalid ${fieldName} format.` });
