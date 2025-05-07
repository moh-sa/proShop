import mongoose from "mongoose";
import assert from "node:assert";
import test, { afterEach, describe, mock, suite } from "node:test";
import { DatabaseError } from "../../errors";
import Order from "../../models/orderModel";
import { orderRepository } from "../../repositories";
import {
  generateMockObjectId,
  generateMockOrder,
  generateMockOrders,
} from "../mocks";

suite("Order Repository 〖 Unit Tests 〗", () => {
  const repo = orderRepository;
  afterEach(() => mock.reset());

  describe("Create Order", () => {
    test("Should return the created order object when 'Order.create' is called", async () => {
      const mockOrder = generateMockOrder();

      const createMock = mock.method(Order, "create", () => ({
        toObject: async () => mockOrder,
      }));

      const order = await repo.create({
        orderData: mockOrder,
      });

      assert.ok(order);
      assert.deepStrictEqual(order, mockOrder);
      assert.strictEqual(createMock.mock.callCount(), 1);
      assert.deepStrictEqual(createMock.mock.calls[0].arguments[0], mockOrder);
    });

    test("Should throw 'DatabaseError' when 'Order.create' throws Mongoose error", async () => {
      const mockOrder = generateMockOrder();
      const mongooseError = new mongoose.Error.ValidationError();
      mongooseError.message = "Validation failed";

      mock.method(Order, "create", () => {
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

    test("Should throw generic 'DatabaseError' when 'Order.create' throws unknown error", async () => {
      const mockOrder = generateMockOrder();
      const unknownError = new Error("Something unexpected happened");

      mock.method(Order, "create", () => {
        throw unknownError;
      });

      await assert.rejects(
        async () => await repo.create({ orderData: mockOrder }),
        (error: Error) => {
          assert.ok(error instanceof DatabaseError);
          assert.strictEqual(error.message, "Database operation failed");
          assert.strictEqual(error.statusCode, 500);
          return true;
        },
      );
    });
  });

  describe("Retrieve Orders", () => {
    test("Should return array of all orders when 'Order.find({})' is called", async () => {
      const mockOrders = generateMockOrders(4);

      const findMock = mock.method(Order, "find", () => ({
        select: () => ({
          lean: async () => mockOrders,
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

    test("Should return empty array when 'Review.find({})' returns empty array", async () => {
      mock.method(Order, "find", () => ({
        select: () => ({
          lean: async () => [],
        }),
      }));

      const orders = await repo.getAll();

      assert.ok(orders);
      assert.ok(orders instanceof Array);
      assert.equal(orders.length, 0);
    });

    test("Should throw 'DatabaseError' when 'Order.find({})' throws Mongoose error", async () => {
      const mongooseError = new mongoose.Error("Query failed");

      mock.method(Order, "find", () => {
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

    test("Should throw generic 'DatabaseError' when 'Order.find({})' throws unknown error", async () => {
      const unknownError = new Error("Something unexpected happened");

      mock.method(Order, "find", () => {
        throw unknownError;
      });

      await assert.rejects(
        async () => await repo.getAll(),
        (error: Error) => {
          assert.ok(error instanceof DatabaseError);
          assert.strictEqual(error.message, "Database operation failed");
          assert.strictEqual(error.statusCode, 500);
          return true;
        },
      );
    });
  });

  describe("Retrieve Order By Id", () => {
    test("Should return the order object when 'Order.findById' is called", async () => {
      const mockOrder = generateMockOrder();
      const orderId = mockOrder._id;

      const findByIdMock = mock.method(Order, "findById", () => ({
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

    test("Should return 'null' when 'Order.findById' returns 'null'", async () => {
      const orderId = generateMockObjectId();

      mock.method(Order, "findById", () => ({
        populate: () => ({
          lean: async () => null,
        }),
      }));

      const order = await repo.getById({ orderId });

      assert.equal(order, null);
    });

    test("Should throw 'DatabaseError' when 'Order.findById' throws Mongoose error", async () => {
      const orderId = generateMockObjectId();
      const mongooseError = new mongoose.Error("Query failed");

      mock.method(Order, "findById", () => {
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

    test("Should throw generic 'DatabaseError' when 'Order.findById' throws unknown error", async () => {
      const orderId = generateMockObjectId();
      const unknownError = new Error("Something unexpected happened");

      mock.method(Order, "findById", () => {
        throw unknownError;
      });

      await assert.rejects(
        async () => await repo.getById({ orderId }),
        (error: Error) => {
          assert.ok(error instanceof DatabaseError);
          assert.strictEqual(error.message, "Database operation failed");
          assert.strictEqual(error.statusCode, 500);
          return true;
        },
      );
    });
  });

  describe("Retrieve Orders By User ID", () => {
    test("Should return array of all orders for a specific user when 'Order.find({user: userId})' is called", async () => {
      const mockOrders = generateMockOrders(4);

      const findMock = mock.method(Order, "find", () => ({
        select: () => ({
          lean: async () => mockOrders,
        }),
      }));

      const orders = await repo.getAllByUserId({
        userId: mockOrders[0].user,
      });

      assert.ok(orders);
      assert.ok(orders instanceof Array);
      assert.strictEqual(orders.length, mockOrders.length);
      assert.strictEqual(orders[0].totalPrice, mockOrders[0].totalPrice);
      assert.strictEqual(findMock.mock.callCount(), 1);
      assert.deepStrictEqual(findMock.mock.calls[0].arguments[0], {
        user: mockOrders[0].user,
      });
    });

    test("Should return empty array when 'Order.find({user: userId})' returns empty array", async () => {
      const userId = generateMockObjectId();

      const findMock = mock.method(Order, "find", () => ({
        select: () => ({
          lean: async () => [],
        }),
      }));

      const orders = await repo.getAllByUserId({
        userId,
      });

      assert.ok(orders);
      assert.ok(orders instanceof Array);
      assert.strictEqual(orders.length, 0);
      assert.strictEqual(findMock.mock.callCount(), 1);
      assert.deepStrictEqual(findMock.mock.calls[0].arguments[0], {
        user: userId,
      });
    });

    test("Should throw 'DatabaseError' when 'Order.find({user: userId})' throws Mongoose error", async () => {
      const userId = generateMockObjectId();
      const mongooseError = new mongoose.Error("Query failed");

      mock.method(Order, "find", () => {
        throw mongooseError;
      });

      await assert.rejects(
        async () => await repo.getAllByUserId({ userId }),
        (error: Error) => {
          assert.ok(error instanceof DatabaseError);
          assert.strictEqual(error.message, mongooseError.message);
          assert.strictEqual(error.statusCode, 500);
          return true;
        },
      );
    });

    test("Should throw generic 'DatabaseError' when 'Order.find({user: userId})' throws unknown error", async () => {
      const userId = generateMockObjectId();
      const unknownError = new Error("Something unexpected happened");

      mock.method(Order, "find", () => {
        throw unknownError;
      });

      await assert.rejects(
        async () => await repo.getAllByUserId({ userId }),
        (error: Error) => {
          assert.ok(error instanceof DatabaseError);
          assert.strictEqual(error.message, "Database operation failed");
          assert.strictEqual(error.statusCode, 500);
          return true;
        },
      );
    });
  });

  describe("Update Order To Paid", () => {
    test("Should update the 'isPaid' and 'paidAt' fields and return the updated order object when 'Order.findByIdAndUpdate' is called", async () => {
      const mockOrder = generateMockOrder();
      const orderId = mockOrder._id;
      mockOrder.isPaid = true;
      mockOrder.paidAt = new Date();

      const findByIdAndUpdateMock = mock.method(
        Order,
        "findByIdAndUpdate",
        () => ({
          lean: async () => mockOrder,
        }),
      );

      const updatedOrder = await repo.updateToPaid({ orderId });

      assert.ok(updatedOrder);
      assert.deepStrictEqual(updatedOrder, mockOrder);
      assert.strictEqual(findByIdAndUpdateMock.mock.callCount(), 1);
      assert.deepStrictEqual(
        findByIdAndUpdateMock.mock.calls[0].arguments[0],
        orderId,
      );
      assert.deepStrictEqual(findByIdAndUpdateMock.mock.calls[0].arguments[1], {
        $set: {
          isPaid: true,
          paidAt: new Date(),
        },
      });
      assert.deepStrictEqual(findByIdAndUpdateMock.mock.calls[0].arguments[2], {
        new: true,
      });
    });

    test("Should return 'null' when 'Order.findByIdAndUpdate' returns 'null'", async () => {
      const orderId = generateMockObjectId();

      mock.method(Order, "findByIdAndUpdate", () => ({
        lean: async () => null,
      }));

      const updatedOrder = await repo.updateToPaid({ orderId });

      assert.strictEqual(updatedOrder, null);
    });

    test("Should throw 'DatabaseError' when 'Order.findByIdAndUpdate' throws Mongoose error", async () => {
      const orderId = generateMockObjectId();
      const mongooseError = new mongoose.Error(
        "Failed to update isPaid and paidAt",
      );

      mock.method(Order, "findByIdAndUpdate", () => {
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

    test("Should throw generic 'DatabaseError' when 'Order.findByIdAndUpdate' throws unknown error", async () => {
      const orderId = generateMockObjectId();
      const unknownError = new Error("Something unexpected happened");

      mock.method(Order, "findByIdAndUpdate", () => {
        throw unknownError;
      });

      await assert.rejects(
        async () => await repo.updateToPaid({ orderId }),
        (error: Error) => {
          assert.ok(error instanceof DatabaseError);
          assert.strictEqual(error.message, "Database operation failed");
          assert.strictEqual(error.statusCode, 500);
          return true;
        },
      );
    });
  });

  describe("Update Order To Delivered", () => {
    test("Should update the 'isDelivered' and 'deliveredAt' fields and return the updated order object when 'Order.findByIdAndUpdate' is called", async () => {
      const mockOrder = generateMockOrder();
      const orderId = mockOrder._id;
      mockOrder.isDelivered = true;
      mockOrder.deliveredAt = new Date();

      const findByIdAndUpdateMock = mock.method(
        Order,
        "findByIdAndUpdate",
        () => ({
          lean: async () => mockOrder,
        }),
      );

      const updatedOrder = await repo.updateToDelivered({ orderId });

      assert.ok(updatedOrder);
      assert.deepStrictEqual(updatedOrder, mockOrder);
      assert.strictEqual(findByIdAndUpdateMock.mock.callCount(), 1);
      assert.deepStrictEqual(
        findByIdAndUpdateMock.mock.calls[0].arguments[0],
        orderId,
      );
      assert.deepStrictEqual(findByIdAndUpdateMock.mock.calls[0].arguments[1], {
        $set: {
          isDelivered: true,
          deliveredAt: new Date(),
        },
      });
      assert.deepStrictEqual(findByIdAndUpdateMock.mock.calls[0].arguments[2], {
        new: true,
      });
    });

    test("Should return 'null' when 'Order.findByIdAndUpdate' returns 'null'", async () => {
      const orderId = generateMockObjectId();

      mock.method(Order, "findByIdAndUpdate", () => ({
        lean: async () => null,
      }));

      const updatedOrder = await repo.updateToDelivered({ orderId });

      assert.strictEqual(updatedOrder, null);
    });

    test("Should throw 'DatabaseError' when 'Order.findByIdAndUpdate' throws Mongoose error", async () => {
      const orderId = generateMockObjectId();
      const mongooseError = new mongoose.Error(
        "Failed to update isPaid and paidAt",
      );

      mock.method(Order, "findByIdAndUpdate", () => {
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

    test("Should throw generic 'DatabaseError' when 'Order.findByIdAndUpdate' throws unknown error", async () => {
      const orderId = generateMockObjectId();
      const unknownError = new Error("Something unexpected happened");

      mock.method(Order, "findByIdAndUpdate", () => {
        throw unknownError;
      });

      await assert.rejects(
        async () => await repo.updateToDelivered({ orderId }),
        (error: Error) => {
          assert.ok(error instanceof DatabaseError);
          assert.strictEqual(error.message, "Database operation failed");
          assert.strictEqual(error.statusCode, 500);
          return true;
        },
      );
    });
  });
});
