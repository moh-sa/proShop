import { authKeys } from "@/features/auth/query/keys";
import { queryClient } from "@/shared/query/client";
import {
	AxiosError,
	AxiosHeaders,
	type AxiosAdapter,
	type InternalAxiosRequestConfig,
} from "axios";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { api } from "./axios";

const SIGNED_IN_USER = { id: "user-1", name: "Test User" };

function respondWith401(message: string) {
	return vi.fn<AxiosAdapter>(async (config) => {
		throw new AxiosError(
			message,
			"ERR_BAD_REQUEST",
			config as InternalAxiosRequestConfig,
			undefined,
			{
				config: config as InternalAxiosRequestConfig,
				data: { message },
				headers: new AxiosHeaders(),
				status: 401,
				statusText: "Unauthorized",
			},
		);
	});
}

describe("api 401 handling", () => {
	const originalAdapter = api.defaults.adapter;

	beforeEach(() => {
		queryClient.setQueryData(authKeys.me(), SIGNED_IN_USER);
	});

	afterEach(() => {
		api.defaults.adapter = originalAdapter;
		queryClient.clear();
	});

	it.each(["/auth/signin", "/auth/signup", "/auth/demo-signin"])(
		"passes a 401 from %s through unchanged, with no extra request",
		async (url) => {
			const adapter = respondWith401("Invalid email or password");
			api.defaults.adapter = adapter;

			const error = await api.post(url, {}).catch((e: unknown) => e);

			expect(error).toBeInstanceOf(AxiosError);
			expect((error as AxiosError).response?.data).toEqual({
				message: "Invalid email or password",
			});
			expect(adapter).toHaveBeenCalledTimes(1);
			expect(queryClient.getQueryData(authKeys.me())).toEqual(SIGNED_IN_USER);
		},
	);

	it("clears the signed-in user when any other request returns 401", async () => {
		const adapter = respondWith401("Session expired or invalid");
		api.defaults.adapter = adapter;

		await api.get("/orders/mine").catch(() => undefined);

		expect(adapter).toHaveBeenCalledTimes(1);
		expect(queryClient.getQueryData(authKeys.me())).toBeNull();
	});

	it("sends requests to the same-origin API path", () => {
		expect(api.defaults.baseURL).toBe("/api/v1");
	});
});
