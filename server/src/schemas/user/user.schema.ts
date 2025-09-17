import { z } from "zod";

import { MAX_NAME_LENGTH, MIN_NAME_LENGTH } from "../../constants/index.js";
import {
	emailValidator,
	objectIdValidator,
	passwordValidator,
} from "../../validators/index.js";

const baseUserSchema = z.object({
	email: emailValidator,
	isAdmin: z.coerce.boolean().default(false),
	name: z
		.string()
		.trim()
		.min(MIN_NAME_LENGTH, {
			message: `Name should be at least ${MIN_NAME_LENGTH} characters long`,
		})
		.max(MAX_NAME_LENGTH, {
			message: `Name should be at most ${MAX_NAME_LENGTH} characters long`,
		}),

	password: passwordValidator,
});

export const insertUserSchema = baseUserSchema;
export const selectUserSchema = baseUserSchema.extend({
	_id: objectIdValidator,
	createdAt: z.date(),
	updatedAt: z.date(),
});
