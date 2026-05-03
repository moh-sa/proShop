import { createUserSchema } from "@/features/users/schemas/user.schemas";

export const signUpInputSchema = createUserSchema.omit({ isAdmin: true });

export const signInInputSchema = createUserSchema.pick({
	email: true,
	password: true,
});
