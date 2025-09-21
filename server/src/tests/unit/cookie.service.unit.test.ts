import assert from "node:assert";
import { describe, it, suite } from "node:test";
import { z } from "zod";

import type { CookieItemOptions } from "../../types/index.js";

import { DEFAULT_COOKIE_CONFIG } from "../../config/index.js";
import { CookieName } from "../../constants/index.js";
import {
	CookieNotFoundError,
	CookieOperationError,
	CookieSerializationError,
	CookieValidationError,
} from "../../errors/index.js";
import { CookieService } from "../../services/index.js";
import { TokenType } from "../../types/index.js";
import { createMockExpressContext } from "../utils/index.js";

suite("Cookie Service〖 Unit Tests 〗", () => {
	const service = new CookieService();

	describe("set", () => {
		it("should set cookie with default options", () => {
			// Arrange
			const name = CookieName.ACCESS_TOKEN;
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
			const name = CookieName.ACCESS_TOKEN;
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
				item: { name: "" as any, value: "x" },
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
				item: { name: TokenType.REFRESH as any, value: "x" },
				response: res,
			});

			// Assert
			assert.strictEqual(result.success, false);
			assert(result.error instanceof CookieValidationError);
		});

		it("should fail when response is invalid", () => {
			// Arrange
			const invalidRes = {} as any;

			// Act
			const result = service.set({
				item: { name: CookieName.ACCESS_TOKEN, value: "x" },
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
					name: CookieName.ACCESS_TOKEN,
					value: BigInt(1) as any,
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
				item: { name: CookieName.ACCESS_TOKEN, value: { a: 1 } },
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
			const name = CookieName.REFRESH_TOKEN;
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
			const name = CookieName.ACCESS_TOKEN;
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
			const result = service.get({ name: "" as any, request: req });

			// Assert
			assert.strictEqual(result.success, false);
			assert(result.error instanceof CookieValidationError);
		});

		it("should fail when request is invalid", () => {
			// Arrange
			const invalidReq = {} as any;

			// Act
			const result = service.get({
				name: CookieName.ACCESS_TOKEN,
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
				name: CookieName.ACCESS_TOKEN,
				request: req,
			});

			// Assert
			assert.strictEqual(result.success, false);
			assert(result.error instanceof CookieNotFoundError);
		});

		it("should fail when parsing JSON throws", () => {
			// Arrange
			const name = CookieName.ACCESS_TOKEN;
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
			const name = CookieName.REFRESH_TOKEN;
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

	describe("delete", () => {});
});
