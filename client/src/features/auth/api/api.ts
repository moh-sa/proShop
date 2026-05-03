import type { User } from "@/features/users";
import { userSchema } from "@/features/users/schemas/user.schemas";
import { ClientApiError, del, get, normalizeError, post } from "@/shared/api";
import { signInInputSchema, signUpInputSchema } from "../schemas";
import type {
	SignInInput,
	SignInOutput,
	SignUpInput,
	SignUpOutput,
} from "../types";

export async function signUpApi(input: SignUpInput): Promise<SignUpOutput> {
	const parsedInput = signUpInputSchema.safeParse(input);
	if (!parsedInput.success) {
		throw new ClientApiError(normalizeError(parsedInput.error, "input"));
	}

	const response = await post("/auth/signup", parsedInput.data, userSchema);
	return response;
}

export async function signInApi(input: SignInInput): Promise<SignInOutput> {
	const parsedInput = signInInputSchema.safeParse(input);
	if (!parsedInput.success) {
		throw new ClientApiError(normalizeError(parsedInput.error, "input"));
	}

	const response = await post("/auth/signin", parsedInput.data, userSchema);
	return response;
}

export async function signOutApi(): Promise<void> {
	await del("/auth/signout/current");
}

export async function fetchMeApi(signal: AbortSignal): Promise<User> {
	return await get("/users/profile", userSchema, signal);
}
