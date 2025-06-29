import assert from "node:assert";
import test, { beforeEach, describe, suite } from "node:test";
import { DatabaseError, EmptyCartError, NotFoundError } from "../../errors";
import { OrderService } from "../../services";
import {
  generateMockObjectId,
  generateMockOrder,
  generateMockOrders,
  mockOrderRepository,
} from "../mocks";

suite("Order Service 〖 Unit Tests 〗", () => {
  const mockRepo = mockOrderRepository();
  const service = new OrderService(mockRepo);

  beforeEach(() => mockRepo.reset());

  describe("create", () => {
    const mockOrder = generateMockOrder();

    test("Should return the order object when 'repo.create' is called once with order data", async () => {
      mockRepo.create.mock.mockImplementationOnce(() =>
        Promise.resolve(mockOrder),
      );

      const order = await service.create(mockOrder);

      assert.ok(order);
      assert.deepStrictEqual(order, mockOrder);

      assert.strictEqual(mockRepo.create.mock.callCount(), 1);
      assert.deepStrictEqual(
        mockRepo.create.mock.calls[0].arguments[0],
        mockOrder,
      );
    });

    test("Should throw 'EmptyCartError' if 'data.orderItems' length is '0'", async () => {
      const mockOrder = generateMockOrder();
      mockOrder.orderItems = [];

      await assert.rejects(
        async () => await service.create(mockOrder),
        EmptyCartError,
      );
    });

    test("Should throw 'DatabaseError' if 'repo.create' throws", async () => {
      mockRepo.create.mock.mockImplementationOnce(() =>
        Promise.reject(new DatabaseError()),
      );

      await assert.rejects(
        async () => await service.create(mockOrder),
        DatabaseError,
      );
    });
  });

  describe("getAll", () => {
    const mockOrders = generateMockOrders(4);

    test("Should return array of orders when 'repo.getAll' is called once with no args", async () => {
      mockRepo.getAll.mock.mockImplementationOnce(() =>
        Promise.resolve(mockOrders),
      );

      const orders = await service.getAll();

      assert.ok(orders);
      assert.deepStrictEqual(orders, mockOrders);

      assert.strictEqual(mockRepo.getAll.mock.callCount(), 1);
      assert.strictEqual(mockRepo.getAll.mock.calls[0].arguments.length, 0);
    });

    test("Should return empty array if 'repo.getAll' returns empty array", async () => {
      mockRepo.getAll.mock.mockImplementationOnce(() => Promise.resolve([]));

      const orders = await service.getAll();

      assert.ok(orders);
      assert.strictEqual(orders.length, 0);
    });

    test("Should throw 'DatabaseError' if 'repo.getAll' throws", async () => {
      mockRepo.getAll.mock.mockImplementationOnce(() =>
        Promise.reject(new DatabaseError()),
      );

      await assert.rejects(
        async () => await service.getAll(),
        (error: Error) => {
          assert.ok(error instanceof DatabaseError);
          assert.strictEqual(error.message, "Database operation failed");
          assert.strictEqual(error.statusCode, 500);
          return true;
        },
      );
    });
  });

  describe("getAllByUserId", () => {
    const mockOrders = generateMockOrders(4);
    const userId = mockOrders[0].user;

    test("Should return array of orders when 'repo.getAllByUserId' is called once with 'userId'", async () => {
      mockRepo.getAllByUserId.mock.mockImplementationOnce(() =>
        Promise.resolve(mockOrders),
      );

      const orders = await service.getAllByUserId({ userId });

      assert.ok(orders);
      assert.deepStrictEqual(orders, mockOrders);

      assert.strictEqual(mockRepo.getAllByUserId.mock.callCount(), 1);
      assert.deepStrictEqual(
        mockRepo.getAllByUserId.mock.calls[0].arguments[0],
        { userId },
      );
    });

    test("Should return empty array if 'repo.getAllByUserId' returns empty array", async () => {
      mockRepo.getAllByUserId.mock.mockImplementationOnce(() =>
        Promise.resolve([]),
      );

      const orders = await service.getAllByUserId({ userId });

      assert.ok(orders);
      assert.strictEqual(orders.length, 0);
    });

    test("Should throw 'DatabaseError' if 'repo.getAllByUserId' throws", async () => {
      mockRepo.getAllByUserId.mock.mockImplementationOnce(() =>
        Promise.reject(new DatabaseError()),
      );

      await assert.rejects(
        async () => await service.getAllByUserId({ userId }),
        DatabaseError,
      );
    });
  });

  describe("getById", () => {
    const mockOrder = generateMockOrder();
    const orderId = mockOrder._id;

    test("Should return order object when 'repo.getById' is called once with 'orderId'", async () => {
      mockRepo.getById.mock.mockImplementationOnce(() =>
        Promise.resolve(mockOrder),
      );

      const order = await service.getById({ orderId });

      assert.ok(order);
      assert.deepStrictEqual(order, mockOrder);

      assert.strictEqual(mockRepo.getById.mock.callCount(), 1);
      assert.deepStrictEqual(mockRepo.getById.mock.calls[0].arguments[0], {
        orderId,
      });
    });

    test("Should throw 'NotFoundError' if 'repo.getById' returns 'null'", async () => {
      mockRepo.getById.mock.mockImplementationOnce(() => Promise.resolve(null));

      await assert.rejects(
        async () => await service.getById({ orderId }),
        NotFoundError,
      );
    });

    test("Should throw 'DatabaseError' if 'repo.getById' throws", async () => {
      mockRepo.getById.mock.mockImplementationOnce(() =>
        Promise.reject(new DatabaseError()),
      );

      await assert.rejects(
        async () => await service.getById({ orderId }),
        DatabaseError,
      );
    });
  });

  describe("updateToPaid", () => {
    const mockOrder = generateMockOrder();
    const orderId = mockOrder._id;

    test("Should return the order object when 'repo.updateToPaid' is called once with 'orderId'", async () => {
      mockRepo.updateToPaid.mock.mockImplementationOnce(() =>
        Promise.resolve(mockOrder),
      );

      const updatedOrder = await service.updateToPaid({
        orderId,
      });

      assert.ok(updatedOrder);
      assert.deepStrictEqual(updatedOrder, mockOrder);

      assert.strictEqual(mockRepo.updateToPaid.mock.callCount(), 1);
      assert.deepStrictEqual(mockRepo.updateToPaid.mock.calls[0].arguments[0], {
        orderId,
      });
    });

    test("Should throw 'NotFoundError' if 'repo.updateToPaid' returns 'null'", async () => {
      mockRepo.updateToPaid.mock.mockImplementationOnce(() =>
        Promise.resolve(null),
      );

      await assert.rejects(
        async () => await service.updateToPaid({ orderId }),
        NotFoundError,
      );
    });

    test("Should throw 'DatabaseError' if 'repo.updateToPaid' throws", async () => {
      mockRepo.updateToPaid.mock.mockImplementationOnce(() =>
        Promise.reject(new DatabaseError()),
      );

      await assert.rejects(
        async () => await service.updateToPaid({ orderId }),
        DatabaseError,
      );
    });
  });

  describe("updateToDelivered", () => {
    const mockOrder = generateMockOrder();
    const orderId = mockOrder._id;

    test("Should return the order object when 'repo.updateToDelivered' is called once with 'orderId", async () => {
      mockRepo.updateToDelivered.mock.mockImplementationOnce(() =>
        Promise.resolve(mockOrder),
      );

      const updatedOrder = await service.updateToDelivered({ orderId });

      assert.ok(updatedOrder);
      assert.deepStrictEqual(updatedOrder, mockOrder);

      assert.strictEqual(mockRepo.updateToDelivered.mock.callCount(), 1);
      assert.deepStrictEqual(
        mockRepo.updateToDelivered.mock.calls[0].arguments[0],
        { orderId },
      );
    });

    test("Should throw 'NotFoundError' if 'repo.updateToDelivered' returns 'null'", async () => {
      mockRepo.updateToDelivered.mock.mockImplementationOnce(() =>
        Promise.resolve(null),
      );

      await assert.rejects(
        async () => await service.updateToDelivered({ orderId }),
        NotFoundError,
      );
    });

    test("Should throw 'DatabaseError' if 'repo.updateToDelivered' throws", async () => {
      const orderId = generateMockObjectId();

      mockRepo.updateToDelivered.mock.mockImplementationOnce(() =>
        Promise.reject(new DatabaseError()),
      );

      await assert.rejects(
        async () => await service.updateToDelivered({ orderId }),
        DatabaseError,
      );
    });
  });
});
