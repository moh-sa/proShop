import assert from "node:assert";
import { after, before, beforeEach, describe, suite, test } from "node:test";
import { ZodError } from "zod";
import { DatabaseError, NotFoundError } from "../errors";
import { mockUser1, mockUser2, mockUser3 } from "../mocks";
import User from "../models/userModel";
import { createMockExpressContext, dbClose, dbConnect } from "../utils";
import { userController } from "./user.controller";

before(async () => dbConnect());
after(async () => dbClose());

suite("User Controller", () => {
  beforeEach(async () => await User.deleteMany({}));

  const controller = userController;

  describe("Register User", () => {
    test("Should register a user and return 201 with data", async () => {
      const { req, res, next } = createMockExpressContext();

      req.body = mockUser1.insert;

      await controller.signup(req, res, next);

      const data = res._getJSONData();
      assert.equal(res.statusCode, 201);
      assert.equal(data.name, mockUser1.insert.name);
      assert.equal(data.email, mockUser1.insert.email);
    });

    test("Should throw 'DatabaseError' if user already exists", async () => {
      const { req, res, next } = createMockExpressContext();
      await User.create(mockUser1.insert);
      req.body = mockUser1.insert;
      try {
        await controller.signup(req, res, next);
      } catch (error) {
        assert.ok(error instanceof DatabaseError);
        assert.equal(error.statusCode, 500);
        assert.ok(error.message.includes("E11000")); // error code for duplication
      }
    });
  });

  describe("Authenticate User", () => {
    test("Should authenticate a user and return 200 with data", async () => {
      const { req, res, next } = createMockExpressContext();

      const user = await User.create(mockUser1.insert);
      res.locals.user = user;

      await controller.signin(req, res, next);
      const data = res._getJSONData();

      assert.equal(res.statusCode, 200);
      assert.equal(data.email, mockUser1.insert.email);
    });
  });

  describe("Retrieve User By ID", () => {
    test("Should retrieve user by ID and return 200 with data", async () => {
      const { req, res, next } = createMockExpressContext();
      const user = await User.create(mockUser1.insert);
      req.params.userId = user._id.toString();

      await controller.getById(req, res, next);
      const data = res._getJSONData();

      assert.equal(res.statusCode, 200);
      assert.equal(data.email, mockUser1.select.email);
      assert.equal(data.name, mockUser1.select.name);
    });

    test("Should throw 'NotFoundError' if user does not exist", async () => {
      const { req, res, next } = createMockExpressContext();
      req.params.userId = "5f81e7e1b8b3c6f0c8a9a1e0";

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

      await User.create([mockUser1.insert, mockUser2.insert, mockUser3.insert]);

      await controller.getAll(req, res, next);
      const data = res._getJSONData();

      assert.equal(res.statusCode, 200);
      assert.equal(data.length, 3);
    });

    test("Should return empty array if no users exist", async () => {
      const { req, res, next } = createMockExpressContext();

      await controller.getAll(req, res, next);
      const data = res._getJSONData();

      assert.equal(res.statusCode, 200);
      assert.equal(data.length, 0);
    });
  });

  describe("Update User", () => {
    test("Should update user and return 200 with updated data", async () => {
      const { req, res, next } = createMockExpressContext();
      const user = await User.create(mockUser1.insert);
      req.params.userId = user._id.toString();
      req.body = { name: mockUser2.insert.name };

      await controller.update(req, res, next);
      const data = res._getJSONData();

      assert.equal(res.statusCode, 200);
      assert.equal(data.email, mockUser1.select.email);
      assert.equal(data.name, mockUser2.insert.name);
    });

    test("Should throw 'NotFoundError' if user does not exist", async () => {
      const { req, res, next } = createMockExpressContext();
      req.params.userId = mockUser1.select._id.toString();
      req.body = { name: mockUser2.insert.name };
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
      const user = await User.create(mockUser1.insert);
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

      const user = await User.create(mockUser1.insert);
      req.params.userId = user._id.toString();

      await controller.delete(req, res, next);
      const data = res._getJSONData();

      assert.equal(res.statusCode, 204);
      assert.equal(data.message, "User removed");
    });

    test("Should throw 'NotFoundError' if user does not exist", async () => {
      const { req, res, next } = createMockExpressContext();
      req.params.userId = mockUser1.select._id.toString();

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
