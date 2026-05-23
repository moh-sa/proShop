import type { User } from "@/features/users";
import { type FormValues } from "./build-update-profile-payload.helper";

export function hasProfileChanges(
	value: FormValues,
	currentUser: Pick<User, "name" | "email">,
): boolean {
	const nameChanged = value.name !== currentUser.name;
	const emailChanged = value.email !== currentUser.email;
	const passwordChanged = value.password.length > 0;

	return nameChanged || emailChanged || passwordChanged;
}
