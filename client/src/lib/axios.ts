import { authKeys } from "@/features/auth/query/keys";
import { queryClient } from "@/shared/query/client";
import axios, { AxiosError } from "axios";

// a 401 here means wrong credentials, not an ended session
const SIGN_IN_ENDPOINTS = new Set([
	"/auth/signin",
	"/auth/signup",
	"/auth/demo-signin",
]);

// same origin as the app: the session cookie is sent automatically
export const api = axios.create({
	baseURL: "/api/v1",
	timeout: 10_000,
	headers: {
		"Content-Type": "application/json",
	},
});

api.interceptors.response.use(
	(response) => response,
	(error) => {
		if (error instanceof AxiosError && error.response?.status === 401) {
			const [path] = (error.config?.url ?? "").split("?");

			if (!SIGN_IN_ENDPOINTS.has(path)) {
				// the session ended (expired, signed out elsewhere, banned):
				// drop the cached user so the route guards redirect to sign-in
				queryClient.setQueryData(authKeys.me(), null);
			}
		}

		// always the original error, so forms show the server's message
		return Promise.reject(error);
	},
);
