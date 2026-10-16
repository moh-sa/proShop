import assert from "node:assert";
import { after, before, beforeEach, describe, suite, test } from "node:test";

import { UserModel } from "../../models/user.model.js";
import {
	findUsersWithPlaintextPasswords,
	hashPlaintextPasswords,
} from "../../scripts/hash-plaintext-passwords.js";
import { passwordService } from "../../services/index.js";
import { generateMockInsertUser } from "../mocks/index.js";
import {
	connectTestDatabase,
	createUser,
	disconnectTestDatabase,
} from "../utils/index.js";

const PLAINTEXT_PASSWORD = "PlainPassword123!";

async function createHashedUser() {
	const hashResult = await passwordService.hash({ password: "Hashed123!" });
	assert.ok(hashResult.success);
	return createUser(generateMockInsertUser({ password: hashResult.data }));
}

suite("Hash Plaintext Passwords Script 〖 Integration Tests 〗", () => {
	before(async () => await connectTestDatabase());
	after(async () => await disconnectTestDatabase());
	beforeEach(async () => await UserModel.deleteMany({}));

	describe("findUsersWithPlaintextPasswords", () => {
		test("Should return only users whose password is not an argon2 hash", async () => {
			// Arrange
			await createHashedUser();
			const plaintextUser = await createUser(
				generateMockInsertUser({ password: PLAINTEXT_PASSWORD }),
			);

			// Act
			const users = await findUsersWithPlaintextPasswords();

			// Assert
			assert.deepStrictEqual(
				users.map((user) => user.id),
				[plaintextUser.id],
			);
			assert.ok(!("password" in users[0]));
		});
	});

	describe("hashPlaintextPasswords", () => {
		test("Should hash plaintext passwords so users can sign in with them", async () => {
			// Arrange
			const plaintextUser = await createUser(
				generateMockInsertUser({ password: PLAINTEXT_PASSWORD }),
			);

			// Act
			const report = await hashPlaintextPasswords();

			// Assert
			assert.deepStrictEqual(report.hashed, [plaintextUser.id]);
			assert.deepStrictEqual(report.skipped, []);
			const stored = await UserModel.findById(plaintextUser.id).lean();
			assert.ok(stored);
			assert.ok(stored.password.startsWith("$argon2"));
			const verifyResult = await passwordService.verify({
				hashedPassword: stored.password,
				password: PLAINTEXT_PASSWORD,
			});
			assert.ok(verifyResult.success);
		});

		test("Should leave already-hashed passwords untouched", async () => {
			// Arrange
			const hashedUser = await createHashedUser();
			const userBefore = await UserModel.findById(hashedUser.id).lean();

			// Act
			const report = await hashPlaintextPasswords();

			// Assert
			assert.deepStrictEqual(report.hashed, []);
			const userAfter = await UserModel.findById(hashedUser.id).lean();
			assert.equal(userAfter?.password, userBefore?.password);
		});

		test("Should find nothing on a second run", async () => {
			// Arrange
			await createUser(
				generateMockInsertUser({ password: PLAINTEXT_PASSWORD }),
			);
			await hashPlaintextPasswords();

			// Act
			const users = await findUsersWithPlaintextPasswords();

			// Assert
			assert.deepStrictEqual(users, []);
		});

		test("Should skip and report a stored value the password rules reject", async () => {
			// Arrange
			const invalidUser = await createUser(
				generateMockInsertUser({ password: PLAINTEXT_PASSWORD }),
			);
			await UserModel.updateOne(
				{ _id: invalidUser.id },
				{ $set: { password: "123" } },
			);

			// Act
			const report = await hashPlaintextPasswords();

			// Assert
			assert.deepStrictEqual(report.hashed, []);
			assert.deepStrictEqual(report.skipped, [invalidUser.id]);
			const stored = await UserModel.findById(invalidUser.id).lean();
			assert.equal(stored?.password, "123");
		});
	});
});
