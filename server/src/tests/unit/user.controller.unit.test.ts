import { Request, Response } from "express";
import assert from "node:assert";
import test, { beforeEach, describe, suite } from "node:test";
import { ZodError } from "zod";
import { UserController } from "../../controllers";
import { DatabaseError, NotFoundError } from "../../errors";
import { InsertUser } from "../../types";
import { createSuccessResponseObject, removeObjectFields } from "../../utils";
import {
  generateMockUser,
  generateMockUsers,
  mockExpressCall,
  mockUserService,
} from "../mocks";

suite("User Controller 〖 Unit Tests 〗", () => {
  const mockService = mockUserService();
  const controller = new UserController(mockService);

  beforeEach(() => {
    mockService.reset();
  });

  describe("getById", () => {
    const { password, ...mockUser } = generateMockUser();
    const userId = mockUser._id;

    test("Should parse 'userId' from 'req.params'", async (t) => {
      const { req, res, next } = mockExpressCall({
        testContext: t,
        req: { params: { userId: userId.toString() } },
      });

      mockService.getById.mock.mockImplementationOnce(() =>
        Promise.resolve(mockUser),
      );

      await assert.doesNotReject(
        async () =>
          await controller.getById(
            req as unknown as Request,
            res as unknown as Response,
            next,
          ),
      );
    });

    test("Should parse 'userId' from 'res.locals'", async (t) => {
      const { req, res, next } = mockExpressCall({
        testContext: t,
        res: { locals: { user: { _id: userId } } },
      });

      mockService.getById.mock.mockImplementationOnce(() =>
        Promise.resolve(mockUser),
      );

      await assert.doesNotReject(
        async () =>
          await controller.getById(
            req as unknown as Request,
            res as unknown as Response,
            next,
          ),
      );
    });

    test("Should throw 'ZodError' if 'userId' is invalid ObjectId", async (t) => {
      const invalidUserId = "invalid-user-id";

      const { req, res, next } = mockExpressCall({
        testContext: t,
        req: { params: { userId: invalidUserId } },
      });

      await assert.rejects(
        async () =>
          await controller.getById(
            req as unknown as Request,
            res as unknown as Response,
            next,
          ),
        (error: Error) => {
          assert.ok(error instanceof ZodError);
          assert.strictEqual(error.issues.length, 1);
          assert.strictEqual(
            error.issues[0].message,
            "Invalid ObjectId format.",
          );
          return true;
        },
      );
    });

    test("Should call 'service.getById' once with the correct 'userId'", async (t) => {
      const { req, res, next } = mockExpressCall({
        testContext: t,
        req: { params: { userId: userId.toString() } },
      });

      mockService.getById.mock.mockImplementationOnce(() =>
        Promise.resolve(mockUser),
      );

      await controller.getById(
        req as unknown as Request,
        res as unknown as Response,
        next,
      );

      assert.strictEqual(mockService.getById.mock.callCount(), 1);
      assert.deepStrictEqual(mockService.getById.mock.calls[0].arguments[0], {
        userId,
      });
    });

    test("Should throw 'DatabaseError' if 'service.getById' throws", async (t) => {
      const { req, res, next } = mockExpressCall({
        testContext: t,
        req: { params: { userId: userId.toString() } },
      });

      mockService.getById.mock.mockImplementationOnce(() =>
        Promise.reject(new DatabaseError()),
      );

      await assert.rejects(
        async () =>
          await controller.getById(
            req as unknown as Request,
            res as unknown as Response,
            next,
          ),
        DatabaseError,
      );
    });

    test("Should call 'res.status' once with '200' after successfully fetching user data", async (t) => {
      const { req, res, next } = mockExpressCall({
        testContext: t,
        req: { params: { userId: userId.toString() } },
      });

      mockService.getById.mock.mockImplementationOnce(() =>
        Promise.resolve(mockUser),
      );

      await controller.getById(
        req as unknown as Request,
        res as unknown as Response,
        next,
      );

      assert.strictEqual(res.status.mock.callCount(), 1);
      assert.strictEqual(res.status.mock.calls[0].arguments[0], 200);
    });

    test("Should call 'res.json' once with the success response object containing user data", async (t) => {
      const { req, res, next } = mockExpressCall({
        testContext: t,
        req: { params: { userId: userId.toString() } },
      });

      mockService.getById.mock.mockImplementationOnce(() =>
        Promise.resolve(mockUser),
      );

      await controller.getById(
        req as unknown as Request,
        res as unknown as Response,
        next,
      );

      assert.strictEqual(res.json.mock.callCount(), 1);
      assert.deepStrictEqual(
        res.json.mock.calls[0].arguments[0],
        createSuccessResponseObject({ data: mockUser }),
      );
    });
  });

  describe("getAll", () => {
    const mockUsers = generateMockUsers(5).map((user) =>
      removeObjectFields(user, ["password"]),
    );

    test("Should call 'service.getAll' once without args", async (t) => {
      const { req, res, next } = mockExpressCall({
        testContext: t,
      });

      mockService.getAll.mock.mockImplementationOnce(() =>
        Promise.resolve(mockUsers),
      );

      await controller.getAll(
        req as unknown as Request,
        res as unknown as Response,
        next,
      );

      assert.strictEqual(mockService.getAll.mock.callCount(), 1);
      assert.strictEqual(mockService.getAll.mock.calls[0].arguments.length, 0);
    });

    test("Should throw 'DatabaseError' if'service.getAll' throws", async (t) => {
      const { req, res, next } = mockExpressCall({
        testContext: t,
      });

      mockService.getAll.mock.mockImplementationOnce(() =>
        Promise.reject(new DatabaseError()),
      );

      await assert.rejects(
        async () =>
          await controller.getAll(
            req as unknown as Request,
            res as unknown as Response,
            next,
          ),
        DatabaseError,
      );
    });

    test("Should call'res.status' once with '200' after successfully fetching all users", async (t) => {
      const { req, res, next } = mockExpressCall({
        testContext: t,
      });

      mockService.getAll.mock.mockImplementationOnce(() =>
        Promise.resolve(mockUsers),
      );

      await controller.getAll(
        req as unknown as Request,
        res as unknown as Response,
        next,
      );

      assert.strictEqual(res.status.mock.callCount(), 1);
      assert.strictEqual(res.status.mock.calls[0].arguments[0], 200);
    });

    test("Should call 'res.json' once with the success response object containing all users", async (t) => {
      const { req, res, next } = mockExpressCall({
        testContext: t,
      });

      mockService.getAll.mock.mockImplementationOnce(() =>
        Promise.resolve(mockUsers),
      );

      await controller.getAll(
        req as unknown as Request,
        res as unknown as Response,
        next,
      );

      assert.strictEqual(res.json.mock.callCount(), 1);
      assert.deepStrictEqual(
        res.json.mock.calls[0].arguments[0],
        createSuccessResponseObject({ data: mockUsers }),
      );
    });
  });

  describe("update", () => {
    const mockUser = generateMockUser();
    const userId = mockUser._id;

    test("Should parse 'userId' from 'req.params'", async (t) => {
      const { req, res, next } = mockExpressCall({
        testContext: t,
        req: { params: { userId: userId.toString() } },
      });

      mockService.updateById.mock.mockImplementationOnce(() =>
        Promise.resolve(mockUser),
      );

      await assert.doesNotReject(
        async () =>
          await controller.update(
            req as unknown as Request,
            res as unknown as Response,
            next,
          ),
      );
    });

    test("Should parse 'userId' from 'res.locals'", async (t) => {
      const { req, res, next } = mockExpressCall({
        testContext: t,
        res: { locals: { user: { _id: userId } } },
      });

      mockService.updateById.mock.mockImplementationOnce(() =>
        Promise.resolve(mockUser),
      );

      await assert.doesNotReject(
        async () =>
          await controller.update(
            req as unknown as Request,
            res as unknown as Response,
            next,
          ),
      );
    });

    test("Should throw 'ZodError' if 'userId' is invalid ObjectId", async (t) => {
      const invalidUserId = "invalid-user-id";

      const { req, res, next } = mockExpressCall({
        testContext: t,
        req: { params: { userId: invalidUserId } },
      });

      await assert.rejects(
        async () =>
          await controller.update(
            req as unknown as Request,
            res as unknown as Response,
            next,
          ),
        (error: Error) => {
          assert.ok(error instanceof ZodError);
          assert.strictEqual(error.issues.length, 1);
          assert.strictEqual(
            error.issues[0].message,
            "Invalid ObjectId format.",
          );
          return true;
        },
      );
    });

    test("Should call 'service.updateById' once with the correct 'userId'", async (t) => {
      const updateData: Partial<InsertUser> = { name: "new-name" };

      const { req, res, next } = mockExpressCall({
        testContext: t,
        req: {
          body: updateData,
          params: { userId: userId.toString() },
        },
      });

      mockService.updateById.mock.mockImplementationOnce(() =>
        Promise.resolve(mockUser),
      );

      await controller.update(
        req as unknown as Request,
        res as unknown as Response,
        next,
      );

      assert.strictEqual(mockService.updateById.mock.callCount(), 1);
      assert.deepStrictEqual(
        mockService.updateById.mock.calls[0].arguments[0],
        {
          userId,
          data: updateData,
        },
      );
    });

    test("Should throw 'DatabaseError' if 'service.updateById' throws", async (t) => {
      const { req, res, next } = mockExpressCall({
        testContext: t,
        req: { params: { userId: userId.toString() } },
      });

      mockService.updateById.mock.mockImplementationOnce(() =>
        Promise.reject(new DatabaseError()),
      );

      await assert.rejects(
        async () =>
          await controller.update(
            req as unknown as Request,
            res as unknown as Response,
            next,
          ),
        DatabaseError,
      );
    });

    test("Should call 'res.status' once with '200' after successfully updating user data", async (t) => {
      const { req, res, next } = mockExpressCall({
        testContext: t,
        req: { params: { userId: userId.toString() } },
      });

      mockService.updateById.mock.mockImplementationOnce(() =>
        Promise.resolve(mockUser),
      );

      await controller.update(
        req as unknown as Request,
        res as unknown as Response,
        next,
      );

      assert.strictEqual(res.status.mock.callCount(), 1);
      assert.strictEqual(res.status.mock.calls[0].arguments[0], 200);
    });

    test("Should call 'res.json' once with the success response object containing user data", async (t) => {
      const { req, res, next } = mockExpressCall({
        testContext: t,
        req: { params: { userId: userId.toString() } },
      });

      mockService.updateById.mock.mockImplementationOnce(() =>
        Promise.resolve(mockUser),
      );

      await controller.update(
        req as unknown as Request,
        res as unknown as Response,
        next,
      );

      assert.strictEqual(res.json.mock.callCount(), 1);
      assert.deepStrictEqual(
        res.json.mock.calls[0].arguments[0],
        createSuccessResponseObject({ data: mockUser }),
      );
    });
  });

  describe("delete", () => {
    const mockUser = generateMockUser();
    const userId = mockUser._id;

    test("Should parse 'userId' from 'req.params'", async (t) => {
      const { req, res, next } = mockExpressCall({
        testContext: t,
        req: { params: { userId: userId.toString() } },
      });

      mockService.delete.mock.mockImplementationOnce(() =>
        Promise.resolve(mockUser),
      );

      await assert.doesNotReject(
        async () =>
          await controller.delete(
            req as unknown as Request,
            res as unknown as Response,
            next,
          ),
      );
    });

    test("Should throw 'ZodError' if 'userId' is invalid ObjectId", async (t) => {
      const invalidUserId = "invalid-user-id";

      const { req, res, next } = mockExpressCall({
        testContext: t,
        req: { params: { userId: invalidUserId } },
      });

      await assert.rejects(
        async () =>
          await controller.delete(
            req as unknown as Request,
            res as unknown as Response,
            next,
          ),
        (error: Error) => {
          assert.ok(error instanceof ZodError);
          assert.strictEqual(error.issues.length, 1);
          assert.strictEqual(
            error.issues[0].message,
            "Invalid ObjectId format.",
          );
          return true;
        },
      );
    });

    test("Should call 'service.delete' once with the correct 'userId'", async (t) => {
      const { req, res, next } = mockExpressCall({
        testContext: t,
        req: { params: { userId: userId.toString() } },
      });

      mockService.delete.mock.mockImplementationOnce(() =>
        Promise.resolve(mockUser),
      );

      await controller.delete(
        req as unknown as Request,
        res as unknown as Response,
        next,
      );

      assert.strictEqual(mockService.delete.mock.callCount(), 1);
      assert.deepStrictEqual(mockService.delete.mock.calls[0].arguments[0], {
        userId,
      });
    });

    test("Should throw 'DatabaseError' if'service.delete' throws", async (t) => {
      const { req, res, next } = mockExpressCall({
        testContext: t,
        req: { params: { userId: userId.toString() } },
      });

      mockService.delete.mock.mockImplementationOnce(() =>
        Promise.reject(new DatabaseError()),
      );

      await assert.rejects(
        async () =>
          await controller.delete(
            req as unknown as Request,
            res as unknown as Response,
            next,
          ),
        DatabaseError,
      );
    });

    test("Should throw 'NotFoundError' if 'service.delete' returns 'null'", async (t) => {
      const { req, res, next } = mockExpressCall({
        testContext: t,
        req: { params: { userId: userId.toString() } },
      });

      mockService.delete.mock.mockImplementationOnce(() =>
        // @ts-expect-error - test case
        Promise.resolve(null),
      );

      await assert.rejects(
        async () =>
          await controller.delete(
            req as unknown as Request,
            res as unknown as Response,
            next,
          ),
        NotFoundError,
      );
    });

    test("Should call 'res.status' once with '204' after successfully deleting user data", async (t) => {
      const { req, res, next } = mockExpressCall({
        testContext: t,
        req: { params: { userId: userId.toString() } },
      });

      mockService.delete.mock.mockImplementationOnce(() =>
        Promise.resolve(mockUser),
      );

      await controller.delete(
        req as unknown as Request,
        res as unknown as Response,
        next,
      );

      assert.strictEqual(res.status.mock.callCount(), 1);
      assert.strictEqual(res.status.mock.calls[0].arguments[0], 204);
    });

    test("Should call 'res.json' once with the success response object containing user data", async (t) => {
      const { req, res, next } = mockExpressCall({
        testContext: t,
        req: { params: { userId: userId.toString() } },
      });

      mockService.delete.mock.mockImplementationOnce(() =>
        Promise.resolve(mockUser),
      );

      await controller.delete(
        req as unknown as Request,
        res as unknown as Response,
        next,
      );

      assert.strictEqual(res.json.mock.callCount(), 1);
      assert.deepStrictEqual(
        res.json.mock.calls[0].arguments[0],
        createSuccessResponseObject({ data: null }),
      );
    });
  });
});
