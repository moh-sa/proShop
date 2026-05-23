import { userSchema, type User } from "@/features/users";
import { ClientApiError, normalizeError, patch } from "@/shared/api";
import { updateProfileSchema } from "../schemas";
import type { UpdateProfile } from "../types";

export async function updateProfileApi(input: UpdateProfile): Promise<User> {
	const parsedInput = updateProfileSchema.safeParse(input);
	if (!parsedInput.success) {
		throw new ClientApiError(normalizeError(parsedInput.error, "input"));
	}

	return await patch("/users/profile", parsedInput.data, userSchema);
}
