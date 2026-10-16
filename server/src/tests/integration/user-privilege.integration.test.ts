import assert from "node:assert";
import { after, before, beforeEach, describe, suite, test } from "node:test";

import { DEMO_ACCOUNT_EMAILS } from "../../constants/index.js";
import { AuthController, UserController } from "../../controllers/index.js";
import { ForbiddenError, ValidationError } from "../../errors/index.js";
import { SessionModel } from "../../models/session.model.js";
import { UserModel } from "../../models/user.model.js";
import { passwordService, sessionService } from "../../services/index.js";
import { generateMockInsertUser } from "../mocks/index.js";
import {
	connectTestDatabase,
	createMockExpressContextFromHandler,
	createUser,
	disconnectTestDatabase,
} from "../utils/index.js";

const CURRENT_PASSWORD = "CurrentPassword123!";
const NEW_PASSWORD = "NewPassword456!";

async function createUserWithHashedPassword(
	options: Parameters<typeof generateMockInsertUser>[0] = {},
) {
	const hashResult = await passwordService.hash({ password: CURRENT_PASSWORD });
	assert.ok(hashResult.success);

	return createUser(
		generateMockInsertUser({
			isAdmin: false,
			...options,
			password: hashResult.data,
		}),
	);
}

// the signed-in state `authenticate` would set
async function signedInLocals(user: Awaited<ReturnType<typeof createUser>>) {
	const sessionResult = await sessionService.create({
		userAgent: "",
		userId: user.id,
	});
	assert.ok(sessionResult.success);
	return { session: sessionResult.data.session, user };
}

async function getStoredPassword(userId: string): Promise<string> {
	const user = await UserModel.findById(userId).lean();
	assert.ok(user);
	return user.password;
}

suite("User Privilege & Password 〖 Integration Tests 〗", () => {
	const authController = new AuthController();
	const userController = new UserController();

	before(async () => await connectTestDatabase());
	after(async () => await disconnectTestDatabase());
	beforeEach(async () => {
		await SessionModel.deleteMany({});
		await UserModel.deleteMany({});
	});

	describe("signUp", () => {
		test("Should ignore 'isAdmin' when a client sends it", async () => {
			// Arrange
			const { next, req, res } = createMockExpressContextFromHandler(
				authController.signUp,
			);
			req.body = {
				...generateMockInsertUser(),
				isAdmin: true,
			} as typeof req.body;

			// Act
			await authController.signUp(req, res, next);

			// Assert
			const response = res._getJSONData();
			assert.ok(response.success);
			assert.equal(response.data.isAdmin, false);
			const stored = await UserModel.findById(response.data.id).lean();
			assert.equal(stored?.isAdmin, false);
		});
	});

	describe("updateProfile", () => {
		test("Should ignore 'isAdmin' when a user updates their own profile", async () => {
			// Arrange
			const { next, req, res } = createMockExpressContextFromHandler(
				userController.updateProfile,
			);
			const user = await createUserWithHashedPassword();
			res.locals = await signedInLocals(user);
			req.body = { isAdmin: true, name: "Updated Name" } as typeof req.body;

			// Act
			await userController.updateProfile(req, res, next);

			// Assert
			const response = res._getJSONData();
			assert.ok(response.success);
			assert.equal(response.data.name, "Updated Name");
			assert.equal(response.data.isAdmin, false);
			const stored = await UserModel.findById(user.id).lean();
			assert.equal(stored?.isAdmin, false);
		});

		test("Should throw 'ValidationError' when 'password' is given without 'currentPassword'", async () => {
			// Arrange
			const { next, req, res } = createMockExpressContextFromHandler(
				userController.updateProfile,
			);
			const user = await createUserWithHashedPassword();
			res.locals = await signedInLocals(user);
			req.body = { password: NEW_PASSWORD };

			// Act & Assert
			await assert.rejects(
				async () => userController.updateProfile(req, res, next),
				ValidationError,
			);
		});

		test("Should throw 'ValidationError' and keep the old password when 'currentPassword' is wrong", async () => {
			// Arrange
			const { next, req, res } = createMockExpressContextFromHandler(
				userController.updateProfile,
			);
			const user = await createUserWithHashedPassword();
			const passwordBefore = await getStoredPassword(user.id);
			res.locals = await signedInLocals(user);
			req.body = {
				currentPassword: "WrongPassword789!",
				name: "Should Not Apply",
				password: NEW_PASSWORD,
			};

			// Act & Assert
			await assert.rejects(
				async () => userController.updateProfile(req, res, next),
				ValidationError,
			);
			const stored = await UserModel.findById(user.id).lean();
			assert.equal(stored?.password, passwordBefore);
			assert.equal(stored?.name, user.name);
		});

		test("Should store a hash of the new password when 'currentPassword' is correct", async () => {
			// Arrange
			const { next, req, res } = createMockExpressContextFromHandler(
				userController.updateProfile,
			);
			const user = await createUserWithHashedPassword();
			res.locals = await signedInLocals(user);
			req.body = { currentPassword: CURRENT_PASSWORD, password: NEW_PASSWORD };

			// Act
			await userController.updateProfile(req, res, next);

			// Assert
			const response = res._getJSONData();
			assert.ok(response.success);
			assert.ok(!("password" in response.data));
			const storedPassword = await getStoredPassword(user.id);
			assert.notEqual(storedPassword, NEW_PASSWORD);
			const verifyResult = await passwordService.verify({
				hashedPassword: storedPassword,
				password: NEW_PASSWORD,
			});
			assert.ok(verifyResult.success);
		});

		test("Should throw 'ForbiddenError' when a demo account changes its password", async () => {
			// Arrange
			const { next, req, res } = createMockExpressContextFromHandler(
				userController.updateProfile,
			);
			const user = await createUserWithHashedPassword({
				email: DEMO_ACCOUNT_EMAILS.customer,
			});
			const passwordBefore = await getStoredPassword(user.id);
			res.locals = await signedInLocals(user);
			req.body = { currentPassword: CURRENT_PASSWORD, password: NEW_PASSWORD };

			// Act & Assert
			await assert.rejects(
				async () => userController.updateProfile(req, res, next),
				ForbiddenError,
			);
			assert.equal(await getStoredPassword(user.id), passwordBefore);
		});
	});

	describe("update (admin)", () => {
		test("Should let an admin change 'isAdmin' of another user", async () => {
			// Arrange
			const { next, req, res } = createMockExpressContextFromHandler(
				userController.update,
			);
			const user = await createUserWithHashedPassword();
			req.params = { userId: user.id };
			req.body = { isAdmin: true };

			// Act
			await userController.update(req, res, next);

			// Assert
			const response = res._getJSONData();
			assert.ok(response.success);
			assert.equal(response.data.isAdmin, true);
		});

		test("Should ignore 'password' when an admin updates a user", async () => {
			// Arrange
			const { next, req, res } = createMockExpressContextFromHandler(
				userController.update,
			);
			const user = await createUserWithHashedPassword();
			const passwordBefore = await getStoredPassword(user.id);
			req.params = { userId: user.id };
			req.body = {
				name: "Updated Name",
				password: NEW_PASSWORD,
			} as typeof req.body;

			// Act
			await userController.update(req, res, next);

			// Assert
			assert.equal(await getStoredPassword(user.id), passwordBefore);
		});

		test("Should throw 'ValidationError' when 'isAdmin' is the string \"false\"", async () => {
			// Arrange
			const { next, req, res } = createMockExpressContextFromHandler(
				userController.update,
			);
			const user = await createUserWithHashedPassword();
			req.params = { userId: user.id };
			req.body = { isAdmin: "false" } as unknown as typeof req.body;

			// Act & Assert
			await assert.rejects(
				async () => userController.update(req, res, next),
				ValidationError,
			);
		});
	});
});
