import type { User } from "@/features/users";
import type { UpdateProfile } from "../types";

export type FormValues = {
	name: string;
	email: string;
	password: string;
	confirmPassword: string;
};

export function buildUpdateProfilePayload(
	value: FormValues,
	currentUser: Pick<User, "name" | "email">,
): UpdateProfile {
	const payload: UpdateProfile = {};
	if (value.name.length > 0 && value.name !== currentUser.name) {
		payload.name = value.name;
	}
	if (value.email.length > 0 && value.email !== currentUser.email) {
		payload.email = value.email;
	}
	if (value.password.length > 0) {
		payload.password = value.password;
	}
	return payload;
}
