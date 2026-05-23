import {
	createUserSchema,
	emailSchema,
	nameSchema,
	passwordSchema,
	type User,
} from "@/features/users";
import z from "zod";
import { hasProfileChanges } from "../helpers/has-profile-changes.helper";

export const updateProfileSchema = createUserSchema
	.omit({ isAdmin: true })
	.partial();

export function createUpdateProfileFormSchema(
	currentUser: Pick<User, "name" | "email">,
) {
	return z
		.object({
			name: z.string().trim(),
			email: z.string().trim(),
			password: z.string().trim(),
			confirmPassword: z.string().trim(),
		})

		.superRefine((data, ctx) => {
			const hasName = data.name.length > 0;
			const hasEmail = data.email.length > 0;
			const hasPassword = data.password.length > 0;
			const hasConfirmPassword = data.confirmPassword.length > 0;

			const hasChanges = hasProfileChanges(data, currentUser);
			if (!hasChanges) {
				ctx.addIssue({
					code: "custom",
					message: "Change at least one field before saving",
					path: [],
				});
				return;
			}

			// validate non-empty fields against their real rules
			if (hasName) {
				const result = nameSchema.safeParse(data.name);
				if (!result.success) {
					result.error.issues.forEach((issue) =>
						ctx.addIssue({ ...issue, path: ["name"] }),
					);
				}
			}

			if (hasEmail) {
				const result = emailSchema.safeParse(data.email);
				if (!result.success) {
					result.error.issues.forEach((issue) =>
						ctx.addIssue({ ...issue, path: ["email"] }),
					);
				}
			}
			if (hasPassword) {
				const result = passwordSchema.safeParse(data.password);
				if (!result.success) {
					result.error.issues.forEach((issue) =>
						ctx.addIssue({ ...issue, path: ["password"] }),
					);
				}
				if (!hasConfirmPassword) {
					ctx.addIssue({
						code: "custom",
						message: "Please confirm your password",
						path: ["confirmPassword"],
					});
				}
			}

			if (hasConfirmPassword && !hasPassword) {
				ctx.addIssue({
					code: "custom",
					message: "Please enter your new password",
					path: ["password"],
				});
			}

			if (
				hasPassword &&
				hasConfirmPassword &&
				data.password !== data.confirmPassword
			) {
				ctx.addIssue({
					code: "custom",
					message: "Passwords do not match",
					path: ["confirmPassword"],
				});
			}
		});
}
