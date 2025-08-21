import assert from "node:assert";
import test, { afterEach, describe, suite } from "node:test";

import { AuthenticationError, DatabaseError } from "../../errors/index.js";
import { AuthService } from "../../services/index.js";
import { removeObjectFields } from "../../utils/index.js";
import {
	generateMockUser,
	mockPasswordService,
	mockUserRepository,
} from "../mocks/index.js";

suite("Auth Service 〖 Unit Tests 〗", () => {
	const mockRepo = mockUserRepository();
	const mockPswService = mockPasswordService();
	const service = new AuthService(mockRepo, mockPswService as any);

	afterEach(() => mockRepo.reset());

	describe("Signup", () => {
		const mockUser = generateMockUser();

		test("Should return user object including token and no password. Call 'repo.existsByEmail' and 'repo.create' once with correct data", async () => {
			mockRepo.existsByEmail.mock.mockImplementationOnce(() =>
				Promise.resolve(null),
			);

			mockRepo.create.mock.mockImplementationOnce(() =>
				Promise.resolve(mockUser),
			);

			const user = await service.signup(mockUser);

			assert.ok(user);
			assert.ok(!Object.keys(user).includes("password"));
			assert.ok(Object.keys(user).includes("token"));

			// FIXME: 'mock.module' is still experimental
			// so in the meantime, the result will be hardcoded
			const userWithoutToken = removeObjectFields(user, ["token"]);
			const expectedResult = removeObjectFields(mockUser, [
				"password",
				"token",
			]);
			assert.deepStrictEqual(userWithoutToken, expectedResult);

			assert.strictEqual(mockRepo.existsByEmail.mock.callCount(), 1);
			assert.deepStrictEqual(
				mockRepo.existsByEmail.mock.calls[0].arguments[0],
				{
					email: mockUser.email,
				},
			);

			assert.strictEqual(mockRepo.create.mock.callCount(), 1);
			assert.deepStrictEqual(
				mockRepo.create.mock.calls[0].arguments[0],
				mockUser,
			);
		});

		test("Should throw 'AuthenticationError' if 'repo.existsByEmail' returns a value", async () => {
			mockRepo.existsByEmail.mock.mockImplementationOnce(() =>
				Promise.resolve(mockUser),
			);

			await assert.rejects(async () => {
				await service.signup(mockUser);
			}, AuthenticationError);
		});

		test("Should throw 'DatabaseError' if 'repo.existsByEmail' throws", async () => {
			mockRepo.existsByEmail.mock.mockImplementationOnce(() =>
				Promise.reject(new DatabaseError()),
			);

			await assert.rejects(async () => {
				await service.signup(mockUser);
			}, DatabaseError);
		});

		test("Should throw 'DatabaseError' if 'repo.create' throws", async () => {
			mockRepo.existsByEmail.mock.mockImplementationOnce(() =>
				Promise.resolve(null),
			);

			mockRepo.create.mock.mockImplementationOnce(() =>
				Promise.reject(new DatabaseError()),
			);

			await assert.rejects(async () => {
				await service.signup(mockUser);
			}, DatabaseError);
		});
	});

	describe("Signin", () => {
		const mockUser = generateMockUser();

		test("Should return user object including  token and no password. Call 'repo.getByEmail' and 'compare' once with correct data", async () => {
			mockRepo.getByEmail.mock.mockImplementationOnce(() =>
				Promise.resolve(mockUser),
			);

			mockPswService.verify.mock.mockImplementationOnce(() =>
				Promise.resolve(true),
			);

			const user = await service.signin(mockUser);

			assert.ok(user);
			assert.ok(!Object.keys(user).includes("password"));
			assert.ok(Object.keys(user).includes("token"));

			// FIXME: 'mock.module' is still experimental
			// so in the meantime, the result will be hardcoded
			const userWithoutToken = removeObjectFields(user, ["token"]);
			const expectedResult = removeObjectFields(mockUser, [
				"password",
				"token",
			]);
			assert.deepStrictEqual(userWithoutToken, expectedResult);

			assert.strictEqual(mockRepo.getByEmail.mock.callCount(), 1);
			assert.deepStrictEqual(mockRepo.getByEmail.mock.calls[0].arguments[0], {
				email: mockUser.email,
			});

			assert.strictEqual(mockPswService.verify.mock.callCount(), 1);
			assert.strictEqual(
				mockPswService.verify.mock.calls[0].arguments[0].password,
				mockUser.password,
			);
			assert.strictEqual(
				mockPswService.verify.mock.calls[0].arguments[0].hashedPassword,
				mockUser.password,
			);
		});

		test("Should throw 'AuthenticationError' if 'repo.getByEmail' returns 'null'", async () => {
			mockRepo.getByEmail.mock.mockImplementationOnce(() =>
				Promise.resolve(null),
			);

			await assert.rejects(
				async () => await service.signin(mockUser),
				AuthenticationError,
			);
		});

		test("Should throw 'AuthenticationError' if 'passwordService.verify' returns 'false'", async () => {
			mockRepo.getByEmail.mock.mockImplementationOnce(() =>
				Promise.resolve(mockUser),
			);

			mockPswService.verify.mock.mockImplementationOnce(() =>
				Promise.resolve(false),
			);

			await assert.rejects(
				async () => await service.signin(mockUser),
				AuthenticationError,
			);
		});

		test("Should throw 'DatabaseError' if 'repo.getByEmail' throws", async () => {
			mockRepo.getByEmail.mock.mockImplementationOnce(() =>
				Promise.reject(new DatabaseError()),
			);

			await assert.rejects(
				async () => await service.signin(mockUser),
				DatabaseError,
			);
		});
	});
});
