import { Request, Response } from "express";
import assert from "node:assert";
import test, { beforeEach, describe, suite } from "node:test";
import { ZodError } from "zod";
import { OrderController } from "../../controllers";
import { DatabaseError } from "../../errors";
import { InsertOrder, SelectOrder } from "../../types";
import { createSuccessResponseObject } from "../../utils";
import {
  generateMockOrder,
  generateMockOrders,
  mockExpressCall,
  mockOrderService,
} from "../mocks";

suite("Order Controller 〖 Unit Tests 〗", () => {
  const mockService = mockOrderService();
  const controller = new OrderController(mockService);

  beforeEach(() => {
    mockService.reset();
  });

  describe("create", () => {
    const { _id, createdAt, updatedAt, ...mockOrder } = generateMockOrder();

    const mockInsertOrder: InsertOrder = mockOrder;
    const mockSelectOrder: SelectOrder = {
      ...mockInsertOrder,
      _id,
      createdAt,
      updatedAt,
    };
    const userId = mockSelectOrder.user;

    test("Should parse 'order data' from 'req.body' and 'userId' from 'res.locals'", async (t) => {
      const { req, res, next } = mockExpressCall({
        testContext: t,
        req: { body: mockInsertOrder },
        res: { locals: { user: { _id: userId.toString() } } },
      });

      mockService.create.mock.mockImplementationOnce(() =>
        Promise.resolve(mockSelectOrder),
      );

      await assert.doesNotReject(
        async () =>
          await controller.create(
            req as unknown as Request,
            res as unknown as Response,
            next,
          ),
      );
    });

    test("Should throw 'ZodError' if 'res.locals.user._id' is invalid ObjectId", async (t) => {
      const { req, res, next } = mockExpressCall({
        testContext: t,
        req: { body: mockInsertOrder },
        res: { locals: { user: { _id: "invalid-user-id" } } },
      });

      await assert.rejects(
        async () =>
          await controller.create(
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

    test("Should throw 'ZodError' if 'order.X' is invalid", { todo: true });

    test("Should call 'service.create' once with the correct 'order data'", async (t) => {
      const { req, res, next } = mockExpressCall({
        testContext: t,
        req: { body: mockInsertOrder },
        res: { locals: { user: { _id: userId.toString() } } },
      });

      mockService.create.mock.mockImplementationOnce(() =>
        Promise.resolve(mockSelectOrder),
      );

      await controller.create(
        req as unknown as Request,
        res as unknown as Response,
        next,
      );

      assert.strictEqual(mockService.create.mock.callCount(), 1);
      assert.deepStrictEqual(
        mockService.create.mock.calls[0].arguments[0],
        mockInsertOrder,
      );
    });

    test("Should throw 'DatabaseError' if 'service.create' throws", async (t) => {
      const { req, res, next } = mockExpressCall({
        testContext: t,
        req: { body: mockInsertOrder },
        res: { locals: { user: { _id: userId.toString() } } },
      });

      mockService.create.mock.mockImplementationOnce(() =>
        Promise.reject(new DatabaseError()),
      );

      await assert.rejects(
        async () =>
          await controller.create(
            req as unknown as Request,
            res as unknown as Response,
            next,
          ),
        DatabaseError,
      );
    });

    test("Should call 'res.status' once with '201' after successfully creating order data", async (t) => {
      const { req, res, next } = mockExpressCall({
        testContext: t,
        req: { body: mockInsertOrder },
        res: { locals: { user: { _id: userId.toString() } } },
      });

      mockService.create.mock.mockImplementationOnce(() =>
        Promise.resolve(mockSelectOrder),
      );

      await controller.create(
        req as unknown as Request,
        res as unknown as Response,
        next,
      );

      assert.strictEqual(res.status.mock.callCount(), 1);
      assert.strictEqual(res.status.mock.calls[0].arguments[0], 201);
    });

    test("Should call 'res.json' once with the success response object containing order data", async (t) => {
      const { req, res, next } = mockExpressCall({
        testContext: t,
        req: { body: mockInsertOrder },
        res: { locals: { user: { _id: userId.toString() } } },
      });

      mockService.create.mock.mockImplementationOnce(() =>
        Promise.resolve(mockSelectOrder),
      );

      await controller.create(
        req as unknown as Request,
        res as unknown as Response,
        next,
      );

      assert.strictEqual(res.json.mock.callCount(), 1);
      assert.deepStrictEqual(
        res.json.mock.calls[0].arguments[0],
        createSuccessResponseObject({ data: mockSelectOrder }),
      );
    });
  });

  describe("getAll", () => {
    const mockOrders = generateMockOrders(5);

    test("Should call 'service.getAll' once without args", async (t) => {
      const { req, res, next } = mockExpressCall({
        testContext: t,
      });

      mockService.getAll.mock.mockImplementationOnce(() =>
        Promise.resolve(mockOrders),
      );

      await assert.doesNotReject(
        async () =>
          await controller.getAll(
            req as unknown as Request,
            res as unknown as Response,
            next,
          ),
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

    test("Should call'res.status' once with '200' after successfully fetching all orders", async (t) => {
      const { req, res, next } = mockExpressCall({
        testContext: t,
      });

      mockService.getAll.mock.mockImplementationOnce(() =>
        Promise.resolve(mockOrders),
      );

      await controller.getAll(
        req as unknown as Request,
        res as unknown as Response,
        next,
      );

      assert.strictEqual(res.status.mock.callCount(), 1);
      assert.strictEqual(res.status.mock.calls[0].arguments[0], 200);
    });

    test("Should call 'res.json' once with the success response object containing all orders", async (t) => {
      const { req, res, next } = mockExpressCall({
        testContext: t,
      });

      mockService.getAll.mock.mockImplementationOnce(() =>
        Promise.resolve(mockOrders),
      );

      await controller.getAll(
        req as unknown as Request,
        res as unknown as Response,
        next,
      );

      assert.strictEqual(res.json.mock.callCount(), 1);
      assert.deepStrictEqual(
        res.json.mock.calls[0].arguments[0],
        createSuccessResponseObject({ data: mockOrders }),
      );
    });
  });

  describe("getAllByUserId", () => {
    const mockOrders = generateMockOrders(2);
    const userId = mockOrders[0].user;

    test("Should parse 'userId' from 'req.params'", async (t) => {
      const { req, res, next } = mockExpressCall({
        testContext: t,
        req: { params: { userId: userId.toString() } },
      });

      mockService.getAllByUserId.mock.mockImplementationOnce(() =>
        Promise.resolve(mockOrders),
      );

      await assert.doesNotReject(
        async () =>
          await controller.getAllByUserId(
            req as unknown as Request,
            res as unknown as Response,
            next,
          ),
      );
    });

    test("Should throw 'ZodError' if 'userId' is invalid ObjectId", async (t) => {
      const { req, res, next } = mockExpressCall({
        testContext: t,
        req: { params: { userId: "invalid-user-id" } },
      });

      await assert.rejects(
        async () =>
          await controller.getAllByUserId(
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

    test("Should call 'service.getAllByUserId' once with the correct 'userId'", async (t) => {
      const { req, res, next } = mockExpressCall({
        testContext: t,
        req: { params: { userId: userId.toString() } },
      });

      mockService.getAllByUserId.mock.mockImplementationOnce(() =>
        Promise.resolve(mockOrders),
      );

      await controller.getAllByUserId(
        req as unknown as Request,
        res as unknown as Response,
        next,
      );

      assert.strictEqual(mockService.getAllByUserId.mock.callCount(), 1);
      assert.deepStrictEqual(
        mockService.getAllByUserId.mock.calls[0].arguments[0],
        {
          userId,
        },
      );
    });

    test("Should throw 'DatabaseError' if 'service.getAllByUserId' throws", async (t) => {
      const { req, res, next } = mockExpressCall({
        testContext: t,
        req: { params: { userId: userId.toString() } },
      });

      mockService.getAllByUserId.mock.mockImplementationOnce(() =>
        Promise.reject(new DatabaseError()),
      );

      await assert.rejects(
        async () =>
          await controller.getAllByUserId(
            req as unknown as Request,
            res as unknown as Response,
            next,
          ),
        DatabaseError,
      );
    });

    test("Should call 'res.status' once with '200' after successfully fetching all orders", async (t) => {
      const { req, res, next } = mockExpressCall({
        testContext: t,
        req: { params: { userId: userId.toString() } },
      });

      mockService.getAllByUserId.mock.mockImplementationOnce(() =>
        Promise.resolve(mockOrders),
      );

      await controller.getAllByUserId(
        req as unknown as Request,
        res as unknown as Response,
        next,
      );

      assert.strictEqual(res.status.mock.callCount(), 1);
      assert.strictEqual(res.status.mock.calls[0].arguments[0], 200);
    });

    test("Should call 'res.json' once with the success response object containing all orders", async (t) => {
      const { req, res, next } = mockExpressCall({
        testContext: t,
        req: { params: { userId: userId.toString() } },
      });

      mockService.getAllByUserId.mock.mockImplementationOnce(() =>
        Promise.resolve(mockOrders),
      );

      await controller.getAllByUserId(
        req as unknown as Request,
        res as unknown as Response,
        next,
      );

      assert.strictEqual(res.json.mock.callCount(), 1);
      assert.deepStrictEqual(
        res.json.mock.calls[0].arguments[0],
        createSuccessResponseObject({ data: mockOrders }),
      );
    });
  });

  describe("getById", () => {
    const mockOrder = generateMockOrder();
    const orderId = mockOrder._id;

    test("Should parse 'orderId' from 'req.params'", async (t) => {
      const { req, res, next } = mockExpressCall({
        testContext: t,
        req: { params: { orderId: orderId.toString() } },
      });

      mockService.getById.mock.mockImplementationOnce(() =>
        Promise.resolve(mockOrder),
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

    test("Should throw 'ZodError' if 'orderId' is invalid ObjectId", async (t) => {
      const { req, res, next } = mockExpressCall({
        testContext: t,
        req: { params: { orderId: "invalid-order-id" } },
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

    test("Should call 'service.getById' once with the correct 'orderId'", async (t) => {
      const { req, res, next } = mockExpressCall({
        testContext: t,
        req: { params: { orderId: orderId.toString() } },
      });

      mockService.getById.mock.mockImplementationOnce(() =>
        Promise.resolve(mockOrder),
      );

      await controller.getById(
        req as unknown as Request,
        res as unknown as Response,
        next,
      );

      assert.strictEqual(mockService.getById.mock.callCount(), 1);
      assert.deepStrictEqual(mockService.getById.mock.calls[0].arguments[0], {
        orderId,
      });
    });

    test("Should throw 'DatabaseError' if 'service.getById' throws", async (t) => {
      const { req, res, next } = mockExpressCall({
        testContext: t,
        req: { params: { orderId: orderId.toString() } },
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

    test("Should call 'res.status' once with '200' after successfully fetching order data", async (t) => {
      const { req, res, next } = mockExpressCall({
        testContext: t,
        req: { params: { orderId: orderId.toString() } },
      });

      mockService.getById.mock.mockImplementationOnce(() =>
        Promise.resolve(mockOrder),
      );

      await controller.getById(
        req as unknown as Request,
        res as unknown as Response,
        next,
      );

      assert.strictEqual(res.status.mock.callCount(), 1);
      assert.strictEqual(res.status.mock.calls[0].arguments[0], 200);
    });

    test("Should call 'res.json' once with the success response object containing order data", async (t) => {
      const { req, res, next } = mockExpressCall({
        testContext: t,
        req: { params: { orderId: orderId.toString() } },
      });

      mockService.getById.mock.mockImplementationOnce(() =>
        Promise.resolve(mockOrder),
      );

      await controller.getById(
        req as unknown as Request,
        res as unknown as Response,
        next,
      );

      assert.strictEqual(res.json.mock.callCount(), 1);
      assert.deepStrictEqual(
        res.json.mock.calls[0].arguments[0],
        createSuccessResponseObject({ data: mockOrder }),
      );
    });
  });

  describe("updateToPaid", () => {
    const mockOrder = generateMockOrder();
    const orderId = mockOrder._id;

    test("Should parse 'orderId' from 'req.params'", async (t) => {
      const { req, res, next } = mockExpressCall({
        testContext: t,
        req: { params: { orderId: orderId.toString() } },
      });

      mockService.updateToPaid.mock.mockImplementationOnce(() =>
        Promise.resolve(mockOrder),
      );

      await assert.doesNotReject(
        async () =>
          await controller.updateToPaid(
            req as unknown as Request,
            res as unknown as Response,
            next,
          ),
      );
    });

    test("Should throw 'ZodError' if 'orderId' is invalid ObjectId", async (t) => {
      const { req, res, next } = mockExpressCall({
        testContext: t,
        req: { params: { orderId: "invalid-order-id" } },
      });

      await assert.rejects(
        async () =>
          await controller.updateToPaid(
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

    test("Should call 'service.updateToPaid' once with the correct 'orderId'", async (t) => {
      const { req, res, next } = mockExpressCall({
        testContext: t,
        req: { params: { orderId: orderId.toString() } },
      });

      mockService.updateToPaid.mock.mockImplementationOnce(() =>
        Promise.resolve(mockOrder),
      );

      await controller.updateToPaid(
        req as unknown as Request,
        res as unknown as Response,
        next,
      );

      assert.strictEqual(mockService.updateToPaid.mock.callCount(), 1);
      assert.deepStrictEqual(
        mockService.updateToPaid.mock.calls[0].arguments[0],
        {
          orderId,
        },
      );
    });

    test("Should throw 'DatabaseError' if 'service.updateToPaid' throws", async (t) => {
      const { req, res, next } = mockExpressCall({
        testContext: t,
        req: { params: { orderId: orderId.toString() } },
      });

      mockService.updateToPaid.mock.mockImplementationOnce(() =>
        Promise.reject(new DatabaseError()),
      );

      await assert.rejects(
        async () =>
          await controller.updateToPaid(
            req as unknown as Request,
            res as unknown as Response,
            next,
          ),
        DatabaseError,
      );
    });

    test("Should call 'res.status' once with '200' after successfully updating order data", async (t) => {
      const { req, res, next } = mockExpressCall({
        testContext: t,
        req: { params: { orderId: orderId.toString() } },
      });

      mockService.updateToPaid.mock.mockImplementationOnce(() =>
        Promise.resolve(mockOrder),
      );

      await controller.updateToPaid(
        req as unknown as Request,
        res as unknown as Response,
        next,
      );

      assert.strictEqual(res.status.mock.callCount(), 1);
      assert.strictEqual(res.status.mock.calls[0].arguments[0], 200);
    });

    test("Should call 'res.json' once with the success response object containing order data", async (t) => {
      const { req, res, next } = mockExpressCall({
        testContext: t,
        req: { params: { orderId: orderId.toString() } },
      });

      mockService.updateToPaid.mock.mockImplementationOnce(() =>
        Promise.resolve(mockOrder),
      );

      await controller.updateToPaid(
        req as unknown as Request,
        res as unknown as Response,
        next,
      );

      assert.strictEqual(res.json.mock.callCount(), 1);
      assert.deepStrictEqual(
        res.json.mock.calls[0].arguments[0],
        createSuccessResponseObject({ data: mockOrder }),
      );
    });
  });

  describe("updateToDelivered", () => {
    const mockOrder = generateMockOrder();
    const orderId = mockOrder._id;

    test("Should parse 'orderId' from 'req.params'", async (t) => {
      const { req, res, next } = mockExpressCall({
        testContext: t,
        req: { params: { orderId: orderId.toString() } },
      });

      mockService.updateToDelivered.mock.mockImplementationOnce(() =>
        Promise.resolve(mockOrder),
      );

      await assert.doesNotReject(
        async () =>
          await controller.updateToDelivered(
            req as unknown as Request,
            res as unknown as Response,
            next,
          ),
      );
    });

    test("Should throw 'ZodError' if 'orderId' is invalid ObjectId", async (t) => {
      const { req, res, next } = mockExpressCall({
        testContext: t,
        req: { params: { orderId: "invalid-order-id" } },
      });

      await assert.rejects(
        async () =>
          await controller.updateToDelivered(
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

    test("Should call 'service.updateToDelivered' once with the correct 'orderId'", async (t) => {
      const { req, res, next } = mockExpressCall({
        testContext: t,
        req: { params: { orderId: orderId.toString() } },
      });

      mockService.updateToDelivered.mock.mockImplementationOnce(() =>
        Promise.resolve(mockOrder),
      );

      await controller.updateToDelivered(
        req as unknown as Request,
        res as unknown as Response,
        next,
      );

      assert.strictEqual(mockService.updateToDelivered.mock.callCount(), 1);
      assert.deepStrictEqual(
        mockService.updateToDelivered.mock.calls[0].arguments[0],
        {
          orderId,
        },
      );
    });

    test("Should throw 'DatabaseError' if 'service.updateToDelivered' throws", async (t) => {
      const { req, res, next } = mockExpressCall({
        testContext: t,
        req: { params: { orderId: orderId.toString() } },
      });

      mockService.updateToDelivered.mock.mockImplementationOnce(() =>
        Promise.reject(new DatabaseError()),
      );

      await assert.rejects(
        async () =>
          await controller.updateToDelivered(
            req as unknown as Request,
            res as unknown as Response,
            next,
          ),
        DatabaseError,
      );
    });

    test("Should call 'res.status' once with '200' after successfully updating order data", async (t) => {
      const { req, res, next } = mockExpressCall({
        testContext: t,
        req: { params: { orderId: orderId.toString() } },
      });

      mockService.updateToDelivered.mock.mockImplementationOnce(() =>
        Promise.resolve(mockOrder),
      );

      await controller.updateToDelivered(
        req as unknown as Request,
        res as unknown as Response,
        next,
      );

      assert.strictEqual(res.status.mock.callCount(), 1);
      assert.strictEqual(res.status.mock.calls[0].arguments[0], 200);
    });

    test("Should call 'res.json' once with the success response object containing order data", async (t) => {
      const { req, res, next } = mockExpressCall({
        testContext: t,
        req: { params: { orderId: orderId.toString() } },
      });

      mockService.updateToDelivered.mock.mockImplementationOnce(() =>
        Promise.resolve(mockOrder),
      );

      await controller.updateToDelivered(
        req as unknown as Request,
        res as unknown as Response,
        next,
      );

      assert.strictEqual(res.json.mock.callCount(), 1);
      assert.deepStrictEqual(
        res.json.mock.calls[0].arguments[0],
        createSuccessResponseObject({ data: mockOrder }),
      );
    });
  });
});
