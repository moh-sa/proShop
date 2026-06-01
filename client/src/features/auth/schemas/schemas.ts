import { createUserSchema } from "@/features/users/schemas/user.schemas";
import { demoRoleSchema } from "@/shared/demo";

export const signUpInputSchema = createUserSchema.omit({ isAdmin: true });

export const signInInputSchema = createUserSchema.pick({
	email: true,
	password: true,
});

export const demoSignInInputSchema = demoRoleSchema;
