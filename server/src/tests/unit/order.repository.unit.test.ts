import mongoose from "mongoose";
import assert from "node:assert";
import test, { describe, suite } from "node:test";
import { DatabaseError } from "../../errors";
import Order from "../../models/orderModel";
import { OrderRepository } from "../../repositories";
import { generateMockOrder, generateMockOrders } from "../mocks";

suite("Order Repository 〖 Unit Tests 〗", () => {
  const repo = new OrderRepository();

  describe("create", () => {
    const mockOrder = generateMockOrder();

    test("Should return the user object when 'db.create' is called once with user data", async (t) => {
      const mockCreate = t.mock.method(Order, "create", () => ({
        toObject: () => mockOrder,
      }));

      const order = await repo.create({ orderData: mockOrder });

      assert.ok(order);
      assert.deepStrictEqual(order, mockOrder);

      assert.strictEqual(mockCreate.mock.callCount(), 1);
      assert.deepStrictEqual(mockCreate.mock.calls[0].arguments[0], mockOrder);
    });

    test("Should throw 'DatabaseError' when 'db.create' throws Mongoose error", async (t) => {
      const mongooseError = new mongoose.Error("create failed");

      t.mock.method(Order, "create", () => {
        throw mongooseError;
      });

      await assert.rejects(
        async () => await repo.create({ orderData: mockOrder }),
        (error: Error) => {
          assert.ok(error instanceof DatabaseError);
          assert.strictEqual(error.message, mongooseError.message);
          return true;
        },
      );
    });

    test("Should throw generic 'DatabaseError' when 'db.create' throws unknown error", async (t) => {
      const unknownError = new Error("Something unexpected happened");

      t.mock.method(Order, "create", () => {
        throw unknownError;
      });

      await assert.rejects(
        async () => await repo.create({ orderData: mockOrder }),
        DatabaseError,
      );
    });
  });

  describe("getAll", () => {
    const mockOrders = generateMockOrders(4);

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

    test("Should throw 'DatabaseError' when 'db.find' throws Mongoose error", async (t) => {
      const mongooseError = new mongoose.Error("Query failed");

      t.mock.method(Order, "find", () => {
        throw mongooseError;
      });

      await assert.rejects(
        async () => await repo.getAll(),
        (error: Error) => {
          assert.ok(error instanceof DatabaseError);
          assert.strictEqual(error.message, mongooseError.message);
          assert.strictEqual(error.statusCode, 500);
          return true;
        },
      );
    });

    test("Should throw generic 'DatabaseError' when 'db.find' throws unknown error", async (t) => {
      const unknownError = new Error("Something unexpected happened");

      t.mock.method(Order, "find", () => {
        throw unknownError;
      });

      await assert.rejects(async () => await repo.getAll(), DatabaseError);
    });
  });

  describe("getAll(userId)", () => {
    const mockOrders = generateMockOrders(4);
    const userId = mockOrders[0].user;

    test("Should return array of orders when 'db.find' is called once with 'userId'", async (t) => {
      const findMock = t.mock.method(Order, "find", () => ({
        select: () => ({
          lean: async () => mockOrders,
        }),
      }));

      const orders = await repo.getAll(mockOrders[0].user);

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

      const orders = await repo.getAll(userId);

      assert.ok(orders);
      assert.ok(orders instanceof Array);
      assert.strictEqual(orders.length, 0);

      assert.strictEqual(findMock.mock.callCount(), 1);
      assert.deepStrictEqual(findMock.mock.calls[0].arguments[0], {
        user: userId,
      });
    });

    test("Should throw 'DatabaseError' when 'db.find({userId})' throws Mongoose error", async (t) => {
      const mongooseError = new mongoose.Error("Query failed");

      t.mock.method(Order, "find", () => {
        throw mongooseError;
      });

      await assert.rejects(
        async () => await repo.getAll(userId),
        (error: Error) => {
          assert.ok(error instanceof DatabaseError);
          assert.strictEqual(error.message, mongooseError.message);
          assert.strictEqual(error.statusCode, 500);
          return true;
        },
      );
    });

    test("Should throw generic 'DatabaseError' when 'Order.find({userId})' throws unknown error", async (t) => {
      const unknownError = new Error("Something unexpected happened");

      t.mock.method(Order, "find", () => {
        throw unknownError;
      });

      await assert.rejects(
        async () => await repo.getAll(userId),
        DatabaseError,
      );
    });
  });

  describe("getById", () => {
    const mockOrder = generateMockOrder();
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

    test("Should throw 'DatabaseError' when 'db.findById' throws Mongoose error", async (t) => {
      const mongooseError = new mongoose.Error("Query failed");

      t.mock.method(Order, "findById", () => {
        throw mongooseError;
      });

      await assert.rejects(
        async () => await repo.getById({ orderId }),
        (error: Error) => {
          assert.ok(error instanceof DatabaseError);
          assert.strictEqual(error.message, mongooseError.message);
          assert.strictEqual(error.statusCode, 500);
          return true;
        },
      );
    });

    test("Should throw generic 'DatabaseError' when 'db.findById' throws unknown error", async (t) => {
      const unknownError = new Error("Something unexpected happened");

      t.mock.method(Order, "findById", () => {
        throw unknownError;
      });

      await assert.rejects(
        async () => await repo.getById({ orderId }),
        DatabaseError,
      );
    });
  });

  describe("updateToPaid", () => {
    const mockOrder = generateMockOrder();
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

    test("Should throw 'DatabaseError' when 'db.findByIdAndUpdate' throws Mongoose error", async (t) => {
      const mongooseError = new mongoose.Error(
        "Failed to update isPaid and paidAt",
      );

      t.mock.method(Order, "findByIdAndUpdate", () => {
        throw mongooseError;
      });

      await assert.rejects(
        async () => await repo.updateToPaid({ orderId }),
        (error: Error) => {
          assert.ok(error instanceof DatabaseError);
          assert.strictEqual(error.message, mongooseError.message);
          assert.strictEqual(error.statusCode, 500);
          return true;
        },
      );
    });

    test("Should throw generic 'DatabaseError' when 'Order.findByIdAndUpdate' throws unknown error", async (t) => {
      const unknownError = new Error("Something unexpected happened");

      t.mock.method(Order, "findByIdAndUpdate", () => {
        throw unknownError;
      });

      await assert.rejects(
        async () => await repo.updateToPaid({ orderId }),
        DatabaseError,
      );
    });
  });

  describe("updateToDelivered", () => {
    const mockOrder = generateMockOrder();
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

    test("Should throw 'DatabaseError' when 'db.findByIdAndUpdate' throws Mongoose error", async (t) => {
      const mongooseError = new mongoose.Error(
        "Failed to update isPaid and paidAt",
      );

      t.mock.method(Order, "findByIdAndUpdate", () => {
        throw mongooseError;
      });

      await assert.rejects(
        async () => await repo.updateToDelivered({ orderId }),
        (error: Error) => {
          assert.ok(error instanceof DatabaseError);
          assert.strictEqual(error.message, mongooseError.message);
          assert.strictEqual(error.statusCode, 500);
          return true;
        },
      );
    });

    test("Should throw generic 'DatabaseError' when 'Order.findByIdAndUpdate' throws unknown error", async (t) => {
      const unknownError = new Error("Something unexpected happened");

      t.mock.method(Order, "findByIdAndUpdate", () => {
        throw unknownError;
      });

      await assert.rejects(
        async () => await repo.updateToDelivered({ orderId }),
        DatabaseError,
      );
    });
  });
});
