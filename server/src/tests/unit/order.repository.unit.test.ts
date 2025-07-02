import mongoose from "mongoose";
import assert from "node:assert";
import test, { describe, suite } from "node:test";
import {
  DatabaseNetworkError,
  DatabaseQueryError,
  DatabaseTimeoutError,
  DatabaseValidationError,
  GenericDatabaseError,
} from "../../errors";
import Order from "../../models/orderModel";
import { OrderRepository } from "../../repositories";
import {
  generateMockInsertOrder,
  generateMockInsertOrders,
  generateMockSelectOrder,
} from "../mocks";

suite("Order Repository 〖 Unit Tests 〗", () => {
  const repo = new OrderRepository();

  describe("create", () => {
    const mockOrder = generateMockInsertOrder();

    test("Should return the user object when 'db.create' is called once with user data", async (t) => {
      const mockCreate = t.mock.method(Order, "create", () => ({
        toObject: () => mockOrder,
      }));

      const order = await repo.create(mockOrder);

      assert.ok(order);
      assert.deepStrictEqual(order, mockOrder);

      assert.strictEqual(mockCreate.mock.callCount(), 1);
      assert.deepStrictEqual(mockCreate.mock.calls[0].arguments[0], mockOrder);
    });

    test("Should throw 'DatabaseValidationError' when 'db.create' throws 'ValidationError'", async (t) => {
      const validationError = new mongoose.Error.ValidationError();

      t.mock.method(Order, "create", () => {
        throw validationError;
      });

      await assert.rejects(
        async () => await repo.create(mockOrder),
        DatabaseValidationError,
      );
    });

    test("Should throw 'DatabaseTimeoutError' when 'db.create' throws 'MongoNetworkTimeoutError'", async (t) => {
      const timeoutError = new mongoose.mongo.MongoNetworkTimeoutError(
        "Timeout",
      );

      t.mock.method(Order, "create", () => {
        throw timeoutError;
      });

      await assert.rejects(
        async () => await repo.create(mockOrder),
        DatabaseTimeoutError,
      );
    });

    test("Should throw 'DatabaseQueryError' when 'db.create' throws 'MongooseError'", async (t) => {
      const queryError = new mongoose.Error("Query failed");

      t.mock.method(Order, "create", () => {
        throw queryError;
      });

      await assert.rejects(
        async () => await repo.create(mockOrder),
        DatabaseQueryError,
      );
    });

    test("Should throw 'DatabaseNetworkError' when 'db.create' throws 'MongoError'", async (t) => {
      const networkError = new mongoose.mongo.MongoError("Network error");

      t.mock.method(Order, "create", () => {
        throw networkError;
      });

      await assert.rejects(
        async () => await repo.create(mockOrder),
        DatabaseNetworkError,
      );
    });

    test("Should throw 'GenericDatabaseError' when 'db.create' throws unknown error", async (t) => {
      const unknownError = new Error("Something unexpected happened");

      t.mock.method(Order, "create", () => {
        throw unknownError;
      });

      await assert.rejects(
        async () => await repo.create(mockOrder),
        GenericDatabaseError,
      );
    });
  });

  describe("getAll", () => {
    const mockOrders = generateMockInsertOrders(4);

    test("Should return array of orders when 'db.find' is called once with empty object arg", async (t) => {
      const findMock = t.mock.method(Order, "find", () => ({
        select: () => ({
          lean: () => mockOrders,
        }),
      }));

      const orders = await repo.getAll();

      assert.ok(orders);
      assert.ok(orders instanceof Array);
      assert.strictEqual(orders.length, mockOrders.length);
      assert.deepStrictEqual(orders, mockOrders);

      assert.strictEqual(findMock.mock.callCount(), 1);
      assert.deepStrictEqual(findMock.mock.calls[0].arguments[0], {});
    });

    test("Should return empty array when 'db.find' returns empty array", async (t) => {
      t.mock.method(Order, "find", () => ({
        select: () => ({
          lean: () => [],
        }),
      }));

      const orders = await repo.getAll();

      assert.ok(orders);
      assert.ok(orders instanceof Array);
      assert.equal(orders.length, 0);
    });

    test("Should throw 'DatabaseValidationError' when 'db.find' throws 'ValidationError'", async (t) => {
      const validationError = new mongoose.Error.ValidationError();

      t.mock.method(Order, "find", () => {
        throw validationError;
      });

      await assert.rejects(
        async () => await repo.getAll(),
        DatabaseValidationError,
      );
    });

    test("Should throw 'DatabaseTimeoutError' when 'db.find' throws 'MongoNetworkTimeoutError'", async (t) => {
      const timeoutError = new mongoose.mongo.MongoNetworkTimeoutError(
        "Timeout",
      );

      t.mock.method(Order, "find", () => {
        throw timeoutError;
      });

      await assert.rejects(
        async () => await repo.getAll(),
        DatabaseTimeoutError,
      );
    });

    test("Should throw 'DatabaseQueryError' when 'db.find' throws 'MongooseError'", async (t) => {
      const queryError = new mongoose.Error("Query failed");

      t.mock.method(Order, "find", () => {
        throw queryError;
      });

      await assert.rejects(async () => await repo.getAll(), DatabaseQueryError);
    });

    test("Should throw 'DatabaseNetworkError' when 'db.find' throws 'MongoError'", async (t) => {
      const networkError = new mongoose.mongo.MongoError("Network error");

      t.mock.method(Order, "find", () => {
        throw networkError;
      });

      await assert.rejects(
        async () => await repo.getAll(),
        DatabaseNetworkError,
      );
    });

    test("Should throw 'GenericDatabaseError' when 'db.find' throws unknown error", async (t) => {
      const unknownError = new Error("Something unexpected happened");

      t.mock.method(Order, "find", () => {
        throw unknownError;
      });

      await assert.rejects(
        async () => await repo.getAll(),
        GenericDatabaseError,
      );
    });
  });

  describe("getAllByUserId", () => {
    const mockOrders = generateMockInsertOrders(4);
    const userId = mockOrders[0].user;

    test("Should return array of orders when 'db.find' is called once with 'userId'", async (t) => {
      const findMock = t.mock.method(Order, "find", () => ({
        select: () => ({
          lean: async () => mockOrders,
        }),
      }));

      const orders = await repo.getAllByUserId({ userId });

      assert.ok(orders);
      assert.ok(orders instanceof Array);
      assert.strictEqual(orders.length, mockOrders.length);
      assert.deepStrictEqual(orders, mockOrders);

      assert.strictEqual(findMock.mock.callCount(), 1);
      assert.deepStrictEqual(findMock.mock.calls[0].arguments[0], {
        user: mockOrders[0].user,
      });
    });

    test("Should return empty array when 'db.find({userId})' returns empty array", async (t) => {
      const findMock = t.mock.method(Order, "find", () => ({
        select: () => ({
          lean: async () => [],
        }),
      }));

      const orders = await repo.getAllByUserId({ userId });

      assert.ok(orders);
      assert.ok(orders instanceof Array);
      assert.strictEqual(orders.length, 0);

      assert.strictEqual(findMock.mock.callCount(), 1);
      assert.deepStrictEqual(findMock.mock.calls[0].arguments[0], {
        user: userId,
      });
    });

    test("Should throw 'DatabaseValidationError' when 'db.find({userId})' throws 'ValidationError'", async (t) => {
      const validationError = new mongoose.Error.ValidationError();

      t.mock.method(Order, "find", () => {
        throw validationError;
      });

      await assert.rejects(
        async () => await repo.getAllByUserId({ userId }),
        DatabaseValidationError,
      );
    });

    test("Should throw 'DatabaseTimeoutError' when 'db.find({userId})' throws 'MongoNetworkTimeoutError'", async (t) => {
      const timeoutError = new mongoose.mongo.MongoNetworkTimeoutError(
        "Timeout",
      );

      t.mock.method(Order, "find", () => {
        throw timeoutError;
      });

      await assert.rejects(
        async () => await repo.getAllByUserId({ userId }),
        DatabaseTimeoutError,
      );
    });

    test("Should throw 'DatabaseQueryError' when 'db.find({userId})' throws 'MongooseError'", async (t) => {
      const queryError = new mongoose.Error("Query failed");

      t.mock.method(Order, "find", () => {
        throw queryError;
      });

      await assert.rejects(
        async () => await repo.getAllByUserId({ userId }),
        DatabaseQueryError,
      );
    });

    test("Should throw 'DatabaseNetworkError' when 'db.find({userId})' throws 'MongoError'", async (t) => {
      const networkError = new mongoose.mongo.MongoError("Network error");

      t.mock.method(Order, "find", () => {
        throw networkError;
      });

      await assert.rejects(
        async () => await repo.getAllByUserId({ userId }),
        DatabaseNetworkError,
      );
    });

    test("Should throw 'GenericDatabaseError' when 'db.find({userId})' throws unknown error", async (t) => {
      const unknownError = new Error("Something unexpected happened");

      t.mock.method(Order, "find", () => {
        throw unknownError;
      });

      await assert.rejects(
        async () => await repo.getAllByUserId({ userId }),
        GenericDatabaseError,
      );
    });
  });

  describe("getById", () => {
    const mockOrder = generateMockSelectOrder();
    const orderId = mockOrder._id;

    test("Should return the order object when 'db.findById' is called once with 'orderId'", async (t) => {
      const findByIdMock = t.mock.method(Order, "findById", () => ({
        populate: () => ({
          lean: async () => mockOrder,
        }),
      }));

      const order = await repo.getById({ orderId });

      assert.ok(order);
      assert.deepStrictEqual(order, mockOrder);

      assert.strictEqual(findByIdMock.mock.callCount(), 1);
      assert.deepStrictEqual(findByIdMock.mock.calls[0].arguments[0], orderId);
    });

    test("Should return 'null' when 'db.findById' returns 'null'", async (t) => {
      t.mock.method(Order, "findById", () => ({
        populate: () => ({
          lean: async () => null,
        }),
      }));

      const order = await repo.getById({ orderId });

      assert.equal(order, null);
    });

    test("Should throw 'DatabaseValidationError' when 'db.findById' throws 'ValidationError'", async (t) => {
      const validationError = new mongoose.Error.ValidationError();

      t.mock.method(Order, "findById", () => {
        throw validationError;
      });

      await assert.rejects(
        async () => await repo.getById({ orderId }),
        DatabaseValidationError,
      );
    });

    test("Should throw 'DatabaseTimeoutError' when 'db.findById' throws 'MongoNetworkTimeoutError'", async (t) => {
      const timeoutError = new mongoose.mongo.MongoNetworkTimeoutError(
        "Timeout",
      );

      t.mock.method(Order, "findById", () => {
        throw timeoutError;
      });

      await assert.rejects(
        async () => await repo.getById({ orderId }),
        DatabaseTimeoutError,
      );
    });

    test("Should throw 'DatabaseQueryError' when 'db.findById' throws 'MongooseError'", async (t) => {
      const queryError = new mongoose.Error("Query failed");

      t.mock.method(Order, "findById", () => {
        throw queryError;
      });

      await assert.rejects(
        async () => await repo.getById({ orderId }),
        DatabaseQueryError,
      );
    });

    test("Should throw 'DatabaseNetworkError' when 'db.findById' throws 'MongoError'", async (t) => {
      const networkError = new mongoose.mongo.MongoError("Network error");

      t.mock.method(Order, "findById", () => {
        throw networkError;
      });

      await assert.rejects(
        async () => await repo.getById({ orderId }),
        DatabaseNetworkError,
      );
    });

    test("Should throw 'GenericDatabaseError' when 'db.findById' throws unknown error", async (t) => {
      const unknownError = new Error("Something unexpected happened");

      t.mock.method(Order, "findById", () => {
        throw unknownError;
      });

      await assert.rejects(
        async () => await repo.getById({ orderId }),
        GenericDatabaseError,
      );
    });
  });

  describe("updateToPaid", () => {
    const mockOrder = generateMockSelectOrder();
    const orderId = mockOrder._id;

    test("Should return the order object with 'isPaid' set to 'true' and 'paidAt' set to the current date when 'db.findByIdAndUpdate' is called once with 'orderId'", async (t) => {
      // FIXME: this is a 'hack' that sets the date to 1970.
      // the '$set' in the method below sets a different date value than the one in the test
      t.mock.timers.enable({ apis: ["Date"] });

      const mockFindByIdAndUpdate = t.mock.method(
        Order,
        "findByIdAndUpdate",
        () => ({
          lean: async () => mockOrder,
        }),
      );

      const updatedOrder = await repo.updateToPaid({ orderId });

      assert.ok(updatedOrder);
      assert.deepStrictEqual(updatedOrder, mockOrder);

      assert.strictEqual(mockFindByIdAndUpdate.mock.callCount(), 1);
      assert.deepStrictEqual(mockFindByIdAndUpdate.mock.calls[0].arguments[1], {
        $set: {
          isPaid: true,
          paidAt: new Date(),
        },
      });
    });

    test("Should return 'null' when 'db.findByIdAndUpdate' returns 'null'", async (t) => {
      t.mock.method(Order, "findByIdAndUpdate", () => ({
        lean: async () => null,
      }));

      const updatedOrder = await repo.updateToPaid({ orderId });

      assert.strictEqual(updatedOrder, null);
    });

    test("Should throw 'DatabaseValidationError' when 'db.findByIdAndUpdate' throws 'ValidationError'", async (t) => {
      const validationError = new mongoose.Error.ValidationError();

      t.mock.method(Order, "findByIdAndUpdate", () => {
        throw validationError;
      });

      await assert.rejects(
        async () => await repo.updateToPaid({ orderId }),
        DatabaseValidationError,
      );
    });

    test("Should throw 'DatabaseTimeoutError' when 'db.findByIdAndUpdate' throws 'MongoNetworkTimeoutError'", async (t) => {
      const timeoutError = new mongoose.mongo.MongoNetworkTimeoutError(
        "Timeout",
      );

      t.mock.method(Order, "findByIdAndUpdate", () => {
        throw timeoutError;
      });

      await assert.rejects(
        async () => await repo.updateToPaid({ orderId }),
        DatabaseTimeoutError,
      );
    });

    test("Should throw 'DatabaseQueryError' when 'db.findByIdAndUpdate' throws 'MongooseError'", async (t) => {
      const queryError = new mongoose.Error("Query failed");

      t.mock.method(Order, "findByIdAndUpdate", () => {
        throw queryError;
      });

      await assert.rejects(
        async () => await repo.updateToPaid({ orderId }),
        DatabaseQueryError,
      );
    });

    test("Should throw 'DatabaseNetworkError' when 'db.findByIdAndUpdate' throws 'MongoError'", async (t) => {
      const networkError = new mongoose.mongo.MongoError("Network error");

      t.mock.method(Order, "findByIdAndUpdate", () => {
        throw networkError;
      });

      await assert.rejects(
        async () => await repo.updateToPaid({ orderId }),
        DatabaseNetworkError,
      );
    });

    test("Should throw 'GenericDatabaseError' when 'db.findByIdAndUpdate' throws unknown error", async (t) => {
      const unknownError = new Error("Something unexpected happened");

      t.mock.method(Order, "findByIdAndUpdate", () => {
        throw unknownError;
      });

      await assert.rejects(
        async () => await repo.updateToPaid({ orderId }),
        GenericDatabaseError,
      );
    });
  });

  describe("updateToDelivered", () => {
    const mockOrder = generateMockSelectOrder();
    const orderId = mockOrder._id;

    test("Should return the order object with 'isDelivered' set to 'true' and 'deliveredAt' set to the current date when 'db.findByIdAndUpdate' is called once with 'orderId'", async (t) => {
      // FIXME: this is a 'hack' that sets the date to 1970.
      // the '$set' in the method below sets a different date value than the one in the test
      t.mock.timers.enable({ apis: ["Date"] });

      const mockFindByIdAndUpdate = t.mock.method(
        Order,
        "findByIdAndUpdate",
        () => ({
          lean: async () => mockOrder,
        }),
      );

      const updatedOrder = await repo.updateToDelivered({ orderId });

      assert.ok(updatedOrder);
      assert.deepStrictEqual(updatedOrder, mockOrder);

      assert.strictEqual(mockFindByIdAndUpdate.mock.callCount(), 1);
      assert.deepStrictEqual(mockFindByIdAndUpdate.mock.calls[0].arguments[1], {
        $set: {
          isDelivered: true,
          deliveredAt: new Date(),
        },
      });
    });

    test("Should return 'null' when 'db.findByIdAndUpdate' returns 'null'", async (t) => {
      t.mock.method(Order, "findByIdAndUpdate", () => ({
        lean: async () => null,
      }));

      const updatedOrder = await repo.updateToDelivered({ orderId });

      assert.strictEqual(updatedOrder, null);
    });

    test("Should throw 'DatabaseValidationError' when 'db.findByIdAndUpdate' throws 'ValidationError'", async (t) => {
      const validationError = new mongoose.Error.ValidationError();

      t.mock.method(Order, "findByIdAndUpdate", () => {
        throw validationError;
      });

      await assert.rejects(
        async () => await repo.updateToDelivered({ orderId }),
        DatabaseValidationError,
      );
    });

    test("Should throw 'DatabaseTimeoutError' when 'db.findByIdAndUpdate' throws 'MongoNetworkTimeoutError'", async (t) => {
      const timeoutError = new mongoose.mongo.MongoNetworkTimeoutError(
        "Timeout",
      );

      t.mock.method(Order, "findByIdAndUpdate", () => {
        throw timeoutError;
      });

      await assert.rejects(
        async () => await repo.updateToDelivered({ orderId }),
        DatabaseTimeoutError,
      );
    });

    test("Should throw 'DatabaseQueryError' when 'db.findByIdAndUpdate' throws 'MongooseError'", async (t) => {
      const queryError = new mongoose.Error("Query failed");

      t.mock.method(Order, "findByIdAndUpdate", () => {
        throw queryError;
      });

      await assert.rejects(
        async () => await repo.updateToDelivered({ orderId }),
        DatabaseQueryError,
      );
    });

    test("Should throw 'DatabaseNetworkError' when 'db.findByIdAndUpdate' throws 'MongoError'", async (t) => {
      const networkError = new mongoose.mongo.MongoError("Network error");

      t.mock.method(Order, "findByIdAndUpdate", () => {
        throw networkError;
      });

      await assert.rejects(
        async () => await repo.updateToDelivered({ orderId }),
        DatabaseNetworkError,
      );
    });

    test("Should throw 'GenericDatabaseError' when 'db.findByIdAndUpdate' throws unknown error", async (t) => {
      const unknownError = new Error("Something unexpected happened");

      t.mock.method(Order, "findByIdAndUpdate", () => {
        throw unknownError;
      });

      await assert.rejects(
        async () => await repo.updateToDelivered({ orderId }),
        GenericDatabaseError,
      );
    });
  });
});
