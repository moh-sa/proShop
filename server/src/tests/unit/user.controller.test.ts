import assert from "node:assert";
import { after, before, beforeEach, describe, suite, test } from "node:test";
import { ZodError } from "zod";
import { userController } from "../../controllers";
import { NotFoundError } from "../../errors";
import User from "../../models/userModel";
import {
  generateMockObjectId,
  generateMockUser,
  generateMockUsers,
} from "../mocks";
import { createMockExpressContext, dbClose, dbConnect } from "../utils";

before(async () => dbConnect());
after(async () => dbClose());
beforeEach(async () => await User.deleteMany({}));
const controller = userController;

suite("User Controller", () => {
  describe("Retrieve User By ID", () => {
    test("Should retrieve user by ID and return 200 with data", async () => {
      const { req, res, next } = createMockExpressContext();
      const mockUser = generateMockUser();

      const user = await User.create(mockUser);
      req.params.userId = user._id.toString();

      await controller.getById(req, res, next);
      const { data } = res._getJSONData();

      assert.equal(res.statusCode, 200);
      assert.equal(data.email, mockUser.email);
      assert.equal(data.name, mockUser.name);
    });

    test("Should throw 'NotFoundError' if user does not exist", async () => {
      const { req, res, next } = createMockExpressContext();
      req.params.userId = generateMockObjectId().toString();

      try {
        await controller.getById(req, res, next);
      } catch (error) {
        assert.ok(error instanceof NotFoundError);
        assert.equal(error.message, "User not found");
        assert.equal(error.statusCode, 404);
      }
    });
  });

  describe("Retrieve Users", () => {
    test("Should retrieve all users and return 200 with array of data", async () => {
      const { req, res, next } = createMockExpressContext();
      const mockUsers = generateMockUsers(3);

      await User.insertMany(mockUsers);

      await controller.getAll(req, res, next);
      const { data } = res._getJSONData();

      assert.equal(res.statusCode, 200);
      assert.equal(data.length, 3);
    });

    test("Should return empty array if no users exist", async () => {
      const { req, res, next } = createMockExpressContext();

      await controller.getAll(req, res, next);
      const { data } = res._getJSONData();

      assert.equal(res.statusCode, 200);
      assert.equal(data.length, 0);
    });
  });

  describe("Update User", () => {
    test("Should update user and return 200 with updated data", async () => {
      const { req, res, next } = createMockExpressContext();
      const [mockUser1, mockUser2] = generateMockUsers(2);

      const user = await User.create(mockUser1);
      req.params.userId = user._id.toString();
      req.body = { name: mockUser2.name };

      await controller.update(req, res, next);
      const { data } = res._getJSONData();

      assert.equal(res.statusCode, 200);
      assert.equal(data.email, mockUser1.email);
      assert.equal(data.name, mockUser2.name);
    });

    test("Should throw 'NotFoundError' if user does not exist", async () => {
      const { req, res, next } = createMockExpressContext();
      const [mockUser1, mockUser2] = generateMockUsers(2);

      req.params.userId = mockUser1._id.toString();
      req.body = { name: mockUser2.name };
      try {
        await controller.update(req, res, next);
      } catch (error) {
        assert.ok(error instanceof NotFoundError);
        assert.equal(error.statusCode, 404);
        assert.equal(error.message, "User not found");
      }
    });

    test("Should throw 'ZodError' if the 'userId' is not a valid", async () => {
      const { req, res, next } = createMockExpressContext();
      req.params.userId = "RANDOM_STRING";

      try {
        await controller.update(req, res, next);
      } catch (error) {
        assert.ok(error instanceof ZodError);
        assert.equal(error.issues[0].message, "Invalid ObjectId format.");
      }
    });

    test("Should throw 'ZodError' if the update data is not a valid", async () => {
      const { req, res, next } = createMockExpressContext();
      const mockUser = generateMockUser();

      const user = await User.create(mockUser);
      req.params.userId = user._id.toString();
      req.body = { email: "RANDOM_EMAIL" };

      try {
        await controller.update(req, res, next);
      } catch (error) {
        assert.ok(error instanceof ZodError);
        assert.equal(error.issues[0].message, "Invalid email format.");
      }
    });
  });

  describe("Delete User", () => {
    test("Should delete user and return 204 with message", async () => {
      const { req, res, next } = createMockExpressContext();
      const mockUser = generateMockUser();

      const user = await User.create(mockUser);
      req.params.userId = user._id.toString();

      await controller.delete(req, res, next);

      assert.equal(res.statusCode, 204);
    });

    test("Should throw 'NotFoundError' if user does not exist", async () => {
      const { req, res, next } = createMockExpressContext();

      req.params.userId = generateMockObjectId().toString();

      try {
        await controller.delete(req, res, next);
      } catch (error) {
        assert.ok(error instanceof NotFoundError);
        assert.equal(error.statusCode, 404);
        assert.equal(error.message, "User not found");
      }
    });
  });
});
