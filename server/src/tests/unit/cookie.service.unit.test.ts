import assert from "node:assert";
import { describe, it, suite } from "node:test";

import type { Request, Response } from "express";
import { z } from "zod";

import { DEFAULT_COOKIE_CONFIG } from "../../config/index.js";
import {
	CookieNotFoundError,
	CookieOperationError,
	CookieSerializationError,
	CookieValidationError,
} from "../../errors/index.js";
import { CookieService } from "../../services/index.js";
import type { CookieItemOptions, CookieName } from "../../types/index.js";
import { createMockExpressContext } from "../utils/index.js";

suite("Cookie Service〖 Unit Tests 〗", () => {
	const service = new CookieService();

	describe("set", () => {
		it("should set cookie with default options", () => {
			// Arrange
			const name = "accessToken";
			const value = { isAdmin: false, userId: "123" };
			const { res } = createMockExpressContext();

			// Act
			const result = service.set({
				item: { name, value },
				response: res,
			});

			// Assert
			assert.strictEqual(result.success, true);
			assert.strictEqual(Object.keys(res.cookies).length, 1);
			assert.strictEqual(res.cookies[name].value, JSON.stringify(value));
		});

		it("should set cookie with merged options", () => {
			// Arrange
			const name = "accessToken";
			const value = { isAdmin: false, userId: "123" };
			const overrideOptions: CookieItemOptions = {
				httpOnly: false,
				maxAge: 1234,
			};

			const { res } = createMockExpressContext();

			// Act
			const result = service.set({
				item: { name, value },
				options: overrideOptions,
				response: res,
			});

			// Assert
			assert.strictEqual(result.success, true);
			assert.strictEqual(Object.keys(res.cookies).length, 1);
			assert.strictEqual(res.cookies[name].value, JSON.stringify(value));
			assert.deepStrictEqual(res.cookies[name].options, {
				...DEFAULT_COOKIE_CONFIG,
				...overrideOptions,
			});
		});

		it("should fail when cookie name is empty", () => {
			// Arrange
			const { res } = createMockExpressContext();

			// Act
			const result = service.set({
				item: { name: "" as unknown as CookieName, value: "x" },
				response: res,
			});

			// Assert
			assert.strictEqual(result.success, false);
			assert(result.error instanceof CookieValidationError);
		});

		it("should fail when cookie name is invalid enum", () => {
			// Arrange
			const { res } = createMockExpressContext();

			// Act
			const result = service.set({
				item: { name: "refresh" as unknown as CookieName, value: "x" },
				response: res,
			});

			// Assert
			assert.strictEqual(result.success, false);
			assert(result.error instanceof CookieValidationError);
		});

		it("should fail when response is invalid", () => {
			// Arrange
			const invalidRes = {} as unknown as Response;

			// Act
			const result = service.set({
				item: { name: "accessToken", value: "x" },
				response: invalidRes,
			});

			// Assert
			assert.strictEqual(result.success, false);
			assert(result.error instanceof CookieValidationError);
		});

		it("should fail when value cannot be stringified", () => {
			// Arrange
			const { res } = createMockExpressContext();

			// Act
			const result = service.set({
				item: {
					name: "accessToken",
					value: BigInt(1),
				},
				response: res,
			});

			// Assert
			assert.strictEqual(result.success, false);
			assert(result.error instanceof CookieSerializationError);
		});

		it("should return operation error when response.cookie throws", () => {
			// Arrange
			const { res } = createMockExpressContext();
			res.cookie = () => {
				throw new Error();
			};

			// Act
			const result = service.set({
				item: { name: "accessToken", value: { a: 1 } },
				response: res,
			});

			// Assert
			assert.strictEqual(result.success, false);
			assert(result.error instanceof CookieOperationError);
		});
	});

	describe("get", () => {
		it("should get cookie without schema", () => {
			// Arrange
			const name = "refreshToken";
			const data = { theme: "dark" };
			const { req } = createMockExpressContext();
			req.signedCookies = { [name]: JSON.stringify(data) };

			// Act
			const result = service.get<typeof data>({ name, request: req });

			// Assert
			assert.strictEqual(result.success, true);
			assert.deepStrictEqual(result.data, data);
		});

		it("should get cookie and validate with schema", () => {
			// Arrange
			const name = "accessToken";
			const data = { age: 30, id: "u1" };
			const { req } = createMockExpressContext();
			req.signedCookies = { [name]: JSON.stringify(data) };

			const schema = z.object({ age: z.number(), id: z.string() });

			// Act
			const result = service.get<typeof data>({
				name,
				request: req,
				schema,
			});

			// Assert
			assert.strictEqual(result.success, true);
			assert.deepStrictEqual(result.data, data);
		});

		it("should fail when cookie name is empty", () => {
			// Arrange
			const { req } = createMockExpressContext();

			// Act
			const result = service.get({
				name: "" as unknown as CookieName,
				request: req,
			});

			// Assert
			assert.strictEqual(result.success, false);
			assert(result.error instanceof CookieValidationError);
		});

		it("should fail when request is invalid", () => {
			// Arrange
			const invalidReq = {} as unknown as Request;

			// Act
			const result = service.get({
				name: "accessToken",
				request: invalidReq,
			});

			// Assert
			assert.strictEqual(result.success, false);
			assert(result.error instanceof CookieValidationError);
		});

		it("should fail when cookie is not found", () => {
			// Arrange
			const { req } = createMockExpressContext();
			req.signedCookies = {};

			// Act
			const result = service.get({
				name: "accessToken",
				request: req,
			});

			// Assert
			assert.strictEqual(result.success, false);
			assert(result.error instanceof CookieNotFoundError);
		});

		it("should fail when parsing JSON throws", () => {
			// Arrange
			const name = "accessToken";
			const { req } = createMockExpressContext();
			req.signedCookies = { [name]: "{" };

			// Act
			const result = service.get({ name, request: req });

			// Assert
			assert.strictEqual(result.success, false);
			assert(result.error instanceof CookieSerializationError);
		});

		it("should fail when schema validation fails", () => {
			// Arrange
			const name = "refreshToken";
			const data = { age: "30", id: "u1" };
			const { req } = createMockExpressContext();
			req.signedCookies = { [name]: JSON.stringify(data) };

			const schema = z.object({ age: z.number(), id: z.string() });

			// Act
			const result = service.get<typeof data>({
				name,
				request: req,
				// @ts-expect-error - test case
				schema,
			});

			// Assert
			assert.strictEqual(result.success, false);
			assert(result.error instanceof CookieValidationError);
		});
	});

	describe("delete", () => {
		it("should clear cookie with merged options and without expires/maxAge", () => {
			// Arrange
			const name = "accessToken";
			const { res } = createMockExpressContext();

			// Act
			const result = service.delete({ name, response: res });

			// Assert
			assert.strictEqual(result.success, true);
			assert.strictEqual(res.cookies[name].value, "");
			assert.strictEqual("expires" in res.cookies[name].options, true);
			assert.strictEqual("maxAge" in res.cookies[name].options, false);
		});

		it("should fail when cookie name is empty", () => {
			// Arrange
			const { res } = createMockExpressContext();

			// Act
			const result = service.delete({
				name: "" as unknown as CookieName,
				response: res,
			});

			// Assert
			assert.strictEqual(result.success, false);
			assert(result.error instanceof CookieValidationError);
		});

		it("should fail when response is invalid", () => {
			// Arrange
			const invalidRes = {} as unknown as Response;

			// Act
			const result = service.delete({
				name: "accessToken",
				response: invalidRes,
			});

			// Assert
			assert.strictEqual(result.success, false);
			assert(result.error instanceof CookieValidationError);
		});

		it("should return operation error when clearCookie throws", () => {
			// Arrange
			const { res } = createMockExpressContext();
			res.clearCookie = () => {
				throw new Error("fail");
			};

			// Act
			const result = service.delete({
				name: "accessToken",
				response: res,
			});

			// Assert
			assert.strictEqual(result.success, false);
			assert(result.error instanceof CookieOperationError);
		});
	});
});
