import assert from "node:assert";
import { afterEach, describe, mock, suite, test } from "node:test";

import type { NextFunction, Request, Response } from "express";
import httpMocks from "node-mocks-http";

import { SESSION_COOKIE_NAME } from "../../constants/index.js";
import {
	AuthenticationError,
	DatabaseNetworkError,
	NotFoundError,
} from "../../errors/index.js";
import { authenticate } from "../../middlewares/index.js";
import { sessionService, userService } from "../../services/index.js";
import { generateMockObjectId } from "../mocks/index.js";

const SESSION = {
	createdAt: new Date(),
	expiresAt: new Date(Date.now() + 60_000),
	id: generateMockObjectId(),
	lastSeenAt: new Date(),
	tokenHash: "a".repeat(64),
	userAgent: "",
	userId: generateMockObjectId(),
	updatedAt: new Date(),
};

async function runAuthenticate(cookieValue: string) {
	const req = httpMocks.createRequest({
		cookies: { [SESSION_COOKIE_NAME]: cookieValue },
	});
	const res = httpMocks.createResponse();
	const next = mock.fn<NextFunction>();

	await authenticate(
		req as unknown as Request,
		res as unknown as Response,
		next,
	);

	const error: unknown = next.mock.calls[0]?.arguments[0];
	const cookieCleared = res.cookies[SESSION_COOKIE_NAME]?.value === "";
	return { cookieCleared, error };
}

suite("Authenticate Middleware 〖 Unit Tests 〗", () => {
	afterEach(() => {
		mock.restoreAll();
	});

	describe("database errors", () => {
		test("Should keep the cookie when the session lookup fails", async () => {
			const dbError = new DatabaseNetworkError();
			mock.method(sessionService, "validate", async () => ({
				error: dbError,
				success: false,
			}));

			const { cookieCleared, error } = await runAuthenticate('"token"');

			assert.strictEqual(error, dbError);
			assert.strictEqual(cookieCleared, false);
		});

		test("Should keep the session when the user lookup fails", async () => {
			const dbError = new DatabaseNetworkError();
			mock.method(sessionService, "validate", async () => ({
				data: SESSION,
				success: true,
			}));
			mock.method(userService, "getById", async () => ({
				error: dbError,
				success: false,
			}));
			const deleteById = mock.method(sessionService, "deleteById");

			const { cookieCleared, error } = await runAuthenticate('"token"');

			assert.strictEqual(error, dbError);
			assert.strictEqual(cookieCleared, false);
			assert.strictEqual(deleteById.mock.callCount(), 0);
		});
	});

	describe("ended sessions", () => {
		test("Should clear the cookie when the session is invalid", async () => {
			mock.method(sessionService, "validate", async () => ({
				error: new AuthenticationError(),
				success: false,
			}));

			const { cookieCleared, error } = await runAuthenticate('"token"');

			assert.ok(error instanceof AuthenticationError);
			assert.strictEqual(cookieCleared, true);
		});

		test("Should delete the session when its user no longer exists", async () => {
			mock.method(sessionService, "validate", async () => ({
				data: SESSION,
				success: true,
			}));
			mock.method(userService, "getById", async () => ({
				error: new NotFoundError("User"),
				success: false,
			}));
			const deleteById = mock.method(
				sessionService,
				"deleteById",
				async () => ({
					data: 1,
					success: true,
				}),
			);

			const { cookieCleared, error } = await runAuthenticate('"token"');

			assert.ok(error instanceof AuthenticationError);
			assert.strictEqual(cookieCleared, true);
			assert.strictEqual(deleteById.mock.callCount(), 1);
		});
	});
});
