import assert from "node:assert";
import { beforeEach, describe, mock, suite, test } from "node:test";

import type { NextFunction, Request, Response } from "express";
import httpMocks from "node-mocks-http";

import { RateLimitError } from "../../errors/index.js";
import { RateLimiterService } from "../../services/index.js";

const ONE_REQUEST_PER_MINUTE = {
	maxRequests: 1,
	message: "Rate limit exceeded.",
	windowMs: 60 * 1000,
};

function callLimiter(
	limiter: ReturnType<RateLimiterService["getLimiter"]>,
	options: { ip?: string; path: string; routePath?: string },
) {
	const req = httpMocks.createRequest({
		ip: options.ip ?? "203.0.113.7",
		url: `/api/v1/auth${options.path}`,
	});
	Object.assign(req, {
		baseUrl: "/api/v1/auth",
		path: options.path,
		route: { path: options.routePath ?? "/signin" },
	});

	const res = httpMocks.createResponse();
	const next = mock.fn<NextFunction>();

	return limiter(
		req as unknown as Request,
		res as unknown as Response,
		next,
	).then(() => next);
}

function wasRateLimited(next: ReturnType<typeof mock.fn<NextFunction>>) {
	const error: unknown = next.mock.calls[0]?.arguments[0];
	return error instanceof RateLimitError;
}

suite("Rate Limiter Service 〖 Integration Tests 〗", () => {
	const service = new RateLimiterService();

	beforeEach(() => {
		service.clearCache();
	});

	describe("limiter key", () => {
		test("Should share one bucket across case and trailing-slash variants of a route", async () => {
			const limiter = service.getLimiter(ONE_REQUEST_PER_MINUTE);

			const first = await callLimiter(limiter, { path: "/signin" });
			const upperCase = await callLimiter(limiter, { path: "/SignIn" });
			const trailingSlash = await callLimiter(limiter, { path: "/signin/" });

			assert.strictEqual(wasRateLimited(first), false);
			assert.strictEqual(wasRateLimited(upperCase), true);
			assert.strictEqual(wasRateLimited(trailingSlash), true);
		});

		test("Should share one bucket across IPv6 addresses in the same /64", async () => {
			const limiter = service.getLimiter(ONE_REQUEST_PER_MINUTE);

			const first = await callLimiter(limiter, {
				ip: "2a02:ce0:2004:392::1",
				path: "/signin",
			});
			const sameNetwork = await callLimiter(limiter, {
				ip: "2a02:ce0:2004:392::2",
				path: "/signin",
			});

			assert.strictEqual(wasRateLimited(first), false);
			assert.strictEqual(wasRateLimited(sameNetwork), true);
		});

		test("Should keep separate buckets for different clients", async () => {
			const limiter = service.getLimiter(ONE_REQUEST_PER_MINUTE);

			const first = await callLimiter(limiter, {
				ip: "203.0.113.7",
				path: "/signin",
			});
			const other = await callLimiter(limiter, {
				ip: "198.51.100.9",
				path: "/signin",
			});

			assert.strictEqual(wasRateLimited(first), false);
			assert.strictEqual(wasRateLimited(other), false);
		});
	});
});
