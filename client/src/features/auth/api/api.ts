import type { User } from "@/features/users";
import { userSchema } from "@/features/users/schemas/user.schemas";
import { ClientApiError, del, get, normalizeError, post } from "@/shared/api";
import {
	demoSignInInputSchema,
	signInInputSchema,
	signUpInputSchema,
} from "../schemas";
import type {
	DemoSignInInput,
	DemoSignInOutput,
	SignInInput,
	SignInOutput,
	SignUpInput,
	SignUpOutput,
} from "../types";

export async function demoSignInApi(
	input: DemoSignInInput,
): Promise<DemoSignInOutput> {
	const parsedInput = demoSignInInputSchema.safeParse(input);
	if (!parsedInput.success) {
		throw new ClientApiError(normalizeError(parsedInput.error, "input"));
	}

	const response = await post("/auth/demo-signin", parsedInput.data, userSchema);
	return response;
}

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

export async function fetchMeApi(signal: AbortSignal): Promise<User | null> {
	try {
		return await get("/users/profile", userSchema, signal);
	} catch (error) {
		// axios interceptor already tried to refresh token and failed
		// 401 here means the token is invalid or expired and must be re-authenticated
		if (
			error instanceof ClientApiError &&
			error.details.kind === "SERVER" &&
			error.details.status === 401
		) {
			return null;
		}

		throw error;
	}
}
