import assert from "node:assert";
import test, { afterEach, describe, suite } from "node:test";

import {
	AuthenticationError,
	DatabaseError,
	PasswordVerifyError,
} from "../../errors/index.js";
import { AuthService } from "../../services/index.js";
import {
	generateMockInsertUser,
	generateMockSelectUser,
	mockPasswordService,
	mockUserRepository,
} from "../mocks/index.js";

suite("Auth Service 〖 Unit Tests 〗", () => {
	const mockRepo = mockUserRepository();
	const mockPswService = mockPasswordService();
	const service = new AuthService(mockRepo, mockPswService as any);

	afterEach(() => mockRepo.reset());

	describe("Signup", () => {
		const mockInsertUser = generateMockInsertUser();
		const mockSelectUser = generateMockSelectUser({ ...mockInsertUser });

		test("Should return user object including token and no password. Call 'repo.existsByEmail' and 'repo.create' once with correct data", async () => {
			mockRepo.existsByEmail.mock.mockImplementationOnce(() =>
				Promise.resolve(null),
			);

			mockRepo.create.mock.mockImplementationOnce(() =>
				Promise.resolve(mockSelectUser),
			);

			const user = await service.signup(mockInsertUser);

			assert.ok(user);
			assert.ok(!Object.keys(user).includes("password"));
			assert.ok(Object.keys(user).includes("token"));

			assert.strictEqual(mockRepo.existsByEmail.mock.callCount(), 1);
			assert.deepStrictEqual(
				mockRepo.existsByEmail.mock.calls[0].arguments[0],
				{
					email: mockInsertUser.email,
				},
			);

			assert.strictEqual(mockRepo.create.mock.callCount(), 1);
			assert.deepStrictEqual(
				mockRepo.create.mock.calls[0].arguments[0],
				mockInsertUser,
			);
		});

		test("Should throw 'AuthenticationError' if 'repo.existsByEmail' returns a value", async () => {
			mockRepo.existsByEmail.mock.mockImplementationOnce(() =>
				Promise.resolve(mockSelectUser),
			);

			await assert.rejects(async () => {
				await service.signup(mockInsertUser);
			}, AuthenticationError);
		});

		test("Should throw 'DatabaseError' if 'repo.existsByEmail' throws", async () => {
			mockRepo.existsByEmail.mock.mockImplementationOnce(() =>
				Promise.reject(new DatabaseError()),
			);

			await assert.rejects(async () => {
				await service.signup(mockInsertUser);
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
				await service.signup(mockInsertUser);
			}, DatabaseError);
		});
	});

	describe("Signin", () => {
		const mockInsertUser = generateMockInsertUser();
		const mockSelectUser = generateMockSelectUser({ ...mockInsertUser });

		test("Should return user object including  token and no password. Call 'repo.getByEmail' and 'compare' once with correct data", async () => {
			mockRepo.getByEmail.mock.mockImplementationOnce(() =>
				Promise.resolve(mockSelectUser),
			);

			mockPswService.verify.mock.mockImplementationOnce(() =>
				Promise.resolve({
					data: undefined,
					success: true,
				}),
			);

			const user = await service.signin(mockInsertUser);

			assert.ok(user);
			assert.ok(!Object.keys(user).includes("password"));
			assert.ok(Object.keys(user).includes("token"));

			const { password: _, ...expectedResult } = mockSelectUser;
			assert.deepStrictEqual(user, expectedResult);

			assert.strictEqual(mockRepo.getByEmail.mock.callCount(), 1);
			assert.deepStrictEqual(mockRepo.getByEmail.mock.calls[0].arguments[0], {
				email: mockInsertUser.email,
			});

			assert.strictEqual(mockPswService.verify.mock.callCount(), 1);
			assert.strictEqual(
				mockPswService.verify.mock.calls[0].arguments[0].password,
				mockInsertUser.password,
			);
			assert.strictEqual(
				mockPswService.verify.mock.calls[0].arguments[0].hashedPassword,
				mockInsertUser.password,
			);
		});

		test("Should throw 'AuthenticationError' if 'repo.getByEmail' returns 'null'", async () => {
			mockRepo.getByEmail.mock.mockImplementationOnce(() =>
				Promise.resolve(null),
			);

			await assert.rejects(
				async () => await service.signin(mockInsertUser),
				AuthenticationError,
			);
		});

		test("Should throw 'AuthenticationError' if 'passwordService.verify' returns 'false'", async () => {
			mockRepo.getByEmail.mock.mockImplementationOnce(() =>
				Promise.resolve(mockSelectUser),
			);

			mockPswService.verify.mock.mockImplementationOnce(() =>
				Promise.resolve({
					error: new PasswordVerifyError({}),
					success: false,
				}),
			);

			await assert.rejects(
				async () => await service.signin(mockInsertUser),
				AuthenticationError,
			);
		});

		test("Should throw 'DatabaseError' if 'repo.getByEmail' throws", async () => {
			mockRepo.getByEmail.mock.mockImplementationOnce(() =>
				Promise.reject(new DatabaseError()),
			);

			await assert.rejects(
				async () => await service.signin(mockInsertUser),
				DatabaseError,
			);
		});
	});
});
