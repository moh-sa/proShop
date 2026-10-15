import { z } from "zod";

import { MAX_NAME_LENGTH, MIN_NAME_LENGTH } from "../../constants/index.js";
import {
	emailValidator,
	objectIdStringValidator,
	objectIdValidator,
	passwordValidator,
} from "../../validators/index.js";

const baseSchema = z.object({
	email: emailValidator,
	isAdmin: z.coerce.boolean(),
	name: z
		.string()
		.trim()
		.min(MIN_NAME_LENGTH, {
			error: `Name should be at least ${MIN_NAME_LENGTH} characters long`,
		})
		.max(MAX_NAME_LENGTH, {
			error: `Name should be at most ${MAX_NAME_LENGTH} characters long`,
		}),

	password: passwordValidator,
});

// internal only (seeds, tests) - `isAdmin` must never come from a client
export const createUserSchema = baseSchema;

export const signUpSchema = baseSchema.pick({
	email: true,
	name: true,
	password: true,
});

export const updateUserSchema = baseSchema.partial().extend({
	userId: objectIdStringValidator,
});

export const updateProfileBodySchema = baseSchema
	.pick({ email: true, name: true, password: true })
	.partial();

export const adminUpdateUserBodySchema = baseSchema
	.pick({ email: true, name: true })
	.partial()
	.extend({
		isAdmin: z.boolean().optional(),
	});

export const userSchema = baseSchema.extend({
	createdAt: z.date(),
	id: objectIdStringValidator,
	updatedAt: z.date(),
});

export const userModelSchema = userSchema.extend({
	id: objectIdValidator,
});
