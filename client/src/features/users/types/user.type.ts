import type z from "zod";
import type {
	createUserSchema,
	updateUserSchema,
	userSchema,
} from "../schemas/user.schemas";

export type CreateUser = z.infer<typeof createUserSchema>;
export type UpdateUser = z.infer<typeof updateUserSchema>;
export type User = z.infer<typeof userSchema>;
