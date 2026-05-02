import { idSchema, selectSchema } from "@/shared/schemas";
import z from "zod";
import {
	MAX_NAME_LENGTH,
	MAX_PASSWORD_LENGTH,
	MIN_NAME_LENGTH,
	MIN_PASSWORD_LENGTH,
} from "../const/user.const";

const nameSchema = z.string().trim().min(MIN_NAME_LENGTH).max(MAX_NAME_LENGTH);

const emailSchema = z.string().trim().toLowerCase().pipe(z.email());

const passwordSchema = z.coerce
	.string()
	.trim()
	.min(MIN_PASSWORD_LENGTH)
	.max(MAX_PASSWORD_LENGTH);

const baseSchema = z.object({
	name: nameSchema,
	email: emailSchema,
	isAdmin: z.boolean().default(false),
});

export const createUserSchema = baseSchema.extend({
	password: passwordSchema,
});

export const updateUserSchema = createUserSchema.partial().extend({
	userId: idSchema,
});

export const userSchema = baseSchema.extend(selectSchema.shape);
