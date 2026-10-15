import assert from "node:assert";
import { after, before, beforeEach, describe, suite, test } from "node:test";

import { AuthController } from "../../controllers/index.js";
import { SessionModel } from "../../models/session.model.js";
import { UserModel } from "../../models/user.model.js";
import { generateMockInsertUser } from "../mocks/index.js";
import {
	connectTestDatabase,
	createMockExpressContextFromHandler,
	disconnectTestDatabase,
} from "../utils/index.js";

suite("User Privilege 〖 Integration Tests 〗", () => {
	const authController = new AuthController();

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
});
