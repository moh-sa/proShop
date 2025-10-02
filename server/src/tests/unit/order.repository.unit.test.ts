import mongoose from "mongoose";
import assert from "node:assert";
import test, { describe, suite } from "node:test";

import {
	DatabaseNetworkError,
	DatabaseQueryError,
	DatabaseTimeoutError,
	DatabaseValidationError,
	GenericDatabaseError,
} from "../../errors/index.js";
import Order from "../../models/order.model.js";
import { OrderRepository } from "../../repositories/index.js";
import {
	generateMockInsertOrder,
	generateMockInsertOrders,
	generateMockSelectOrder,
} from "../mocks/index.js";

suite("Order Repository 〖 Unit Tests 〗", () => {
	const repo = new OrderRepository();

	describe("create", () => {
		const mockOrder = generateMockInsertOrder();

		test("Should return the user object when 'db.create' is called once with user data", async (t) => {
			// Arrange
			const mockCreate = t.mock.method(Order, "create", () => ({
				toObject: () => mockOrder,
			}));

			// Act
			const order = await repo.create(mockOrder);

			// Assert
			assert.ok(order);
			assert.strictEqual(order.success, true);
			assert.deepStrictEqual(order.data, mockOrder);

			assert.strictEqual(mockCreate.mock.callCount(), 1);
			assert.deepStrictEqual(mockCreate.mock.calls[0].arguments[0], mockOrder);
		});

		test("Should return 'DatabaseValidationError' when 'db.create' throws 'ValidationError'", async (t) => {
			// Arrange
			const validationError = new mongoose.Error.ValidationError();

			t.mock.method(Order, "create", () => {
				throw validationError;
			});

			// Act
			const result = await repo.create(mockOrder);

			// Assert
			assert.strictEqual(result.success, false);
			assert.ok(result.error instanceof DatabaseValidationError);
		});

		test("Should return 'DatabaseTimeoutError' when 'db.create' throws 'MongoNetworkTimeoutError'", async (t) => {
			// Arrange
			const timeoutError = new mongoose.mongo.MongoNetworkTimeoutError(
				"Timeout",
			);

			t.mock.method(Order, "create", () => {
				throw timeoutError;
			});

			// Act
			const result = await repo.create(mockOrder);

			// Assert
			assert.strictEqual(result.success, false);
			assert.ok(result.error instanceof DatabaseTimeoutError);
		});

		test("Should return 'DatabaseQueryError' when 'db.create' throws 'MongooseError'", async (t) => {
			// Arrange
			const queryError = new mongoose.Error("Query failed");

			t.mock.method(Order, "create", () => {
				throw queryError;
			});

			// Act
			const result = await repo.create(mockOrder);

			// Assert
			assert.strictEqual(result.success, false);
			assert.ok(result.error instanceof DatabaseQueryError);
		});

		test("Should return 'DatabaseNetworkError' when 'db.create' throws 'MongoError'", async (t) => {
			// Arrange
			const networkError = new mongoose.mongo.MongoError("Network error");

			t.mock.method(Order, "create", () => {
				throw networkError;
			});

			// Act
			const result = await repo.create(mockOrder);

			// Assert
			assert.strictEqual(result.success, false);
			assert.ok(result.error instanceof DatabaseNetworkError);
		});

		test("Should return 'GenericDatabaseError' when 'db.create' throws unknown error", async (t) => {
			// Arrange
			const unknownError = new Error("Something unexpected happened");

			t.mock.method(Order, "create", () => {
				throw unknownError;
			});

			// Act
			const result = await repo.create(mockOrder);

			// Assert
			assert.strictEqual(result.success, false);
			assert.ok(result.error instanceof GenericDatabaseError);
		});
	});

	describe("getAll", () => {
		const mockOrders = generateMockInsertOrders(4);

		test("Should return array of orders when 'db.find' is called once with empty object arg", async (t) => {
			// Arrange
			const findMock = t.mock.method(Order, "find", () => ({
				select: () => ({
					lean: () => mockOrders,
				}),
			}));

			// Act
			const orders = await repo.getAll();

			// Assert
			assert.ok(orders);
			assert.strictEqual(orders.success, true);
			assert.ok(Array.isArray(orders.data));
			assert.strictEqual(orders.data.length, mockOrders.length);
			assert.deepStrictEqual(orders.data, mockOrders);

			assert.strictEqual(findMock.mock.callCount(), 1);
			assert.deepStrictEqual(findMock.mock.calls[0].arguments[0], {});
		});

		test("Should return empty array when 'db.find' returns empty array", async (t) => {
			// Arrange
			t.mock.method(Order, "find", () => ({
				select: () => ({
					lean: () => [],
				}),
			}));

			// Act
			const orders = await repo.getAll();

			// Assert
			assert.ok(orders);
			assert.strictEqual(orders.success, true);
			assert.ok(Array.isArray(orders.data));
			assert.strictEqual(orders.data.length, 0);
		});

		test("Should return 'DatabaseValidationError' when 'db.find' throws 'ValidationError'", async (t) => {
			// Arrange
			const validationError = new mongoose.Error.ValidationError();

			t.mock.method(Order, "find", () => {
				throw validationError;
			});

			// Act
			const result = await repo.getAll();

			// Assert
			assert.strictEqual(result.success, false);
			assert.ok(result.error instanceof DatabaseValidationError);
		});

		test("Should return 'DatabaseTimeoutError' when 'db.find' throws 'MongoNetworkTimeoutError'", async (t) => {
			// Arrange
			const timeoutError = new mongoose.mongo.MongoNetworkTimeoutError(
				"Timeout",
			);

			t.mock.method(Order, "find", () => {
				throw timeoutError;
			});

			// Act
			const result = await repo.getAll();

			// Assert
			assert.strictEqual(result.success, false);
			assert.ok(result.error instanceof DatabaseTimeoutError);
		});

		test("Should return 'DatabaseQueryError' when 'db.find' throws 'MongooseError'", async (t) => {
			// Arrange
			const queryError = new mongoose.Error("Query failed");

			t.mock.method(Order, "find", () => {
				throw queryError;
			});

			// Act
			const result = await repo.getAll();

			// Assert
			assert.strictEqual(result.success, false);
			assert.ok(result.error instanceof DatabaseQueryError);
		});

		test("Should return 'DatabaseNetworkError' when 'db.find' throws 'MongoError'", async (t) => {
			// Arrange
			const networkError = new mongoose.mongo.MongoError("Network error");

			t.mock.method(Order, "find", () => {
				throw networkError;
			});

			// Act
			const result = await repo.getAll();

			// Assert
			assert.strictEqual(result.success, false);
			assert.ok(result.error instanceof DatabaseNetworkError);
		});

		test("Should return 'GenericDatabaseError' when 'db.find' throws unknown error", async (t) => {
			// Arrange
			const unknownError = new Error("Something unexpected happened");

			t.mock.method(Order, "find", () => {
				throw unknownError;
			});

			// Act
			const result = await repo.getAll();

			// Assert
			assert.strictEqual(result.success, false);
			assert.ok(result.error instanceof GenericDatabaseError);
		});
	});

	describe("getAllByUserId", () => {
		const mockOrders = generateMockInsertOrders(4);
		const userId = mockOrders[0].user;

		test("Should return array of orders when 'db.find' is called once with 'userId'", async (t) => {
			// Arrange
			const findMock = t.mock.method(Order, "find", () => ({
				select: () => ({
					lean: async () => mockOrders,
				}),
			}));

			// Act
			const orders = await repo.getAllByUserId({ userId });

			// Assert
			assert.ok(orders);
			assert.strictEqual(orders.success, true);
			assert.ok(Array.isArray(orders.data));
			assert.strictEqual(orders.data.length, mockOrders.length);
			assert.deepStrictEqual(orders.data, mockOrders);

			assert.strictEqual(findMock.mock.callCount(), 1);
			assert.deepStrictEqual(findMock.mock.calls[0].arguments[0], {
				user: userId,
			});
		});

		test("Should return empty array when 'db.find({userId})' returns empty array", async (t) => {
			// Arrange
			const findMock = t.mock.method(Order, "find", () => ({
				select: () => ({
					lean: async () => [],
				}),
			}));

			// Act
			const orders = await repo.getAllByUserId({ userId });

			// Assert
			assert.ok(orders);
			assert.strictEqual(orders.success, true);
			assert.ok(Array.isArray(orders.data));
			assert.strictEqual(orders.data.length, 0);

			assert.strictEqual(findMock.mock.callCount(), 1);
			assert.deepStrictEqual(findMock.mock.calls[0].arguments[0], {
				user: userId,
			});
		});

		test("Should return 'DatabaseValidationError' when 'db.find({userId})' throws 'ValidationError'", async (t) => {
			// Arrange
			const validationError = new mongoose.Error.ValidationError();

			t.mock.method(Order, "find", () => {
				throw validationError;
			});

			// Act
			const result = await repo.getAllByUserId({ userId });

			// Assert
			assert.strictEqual(result.success, false);
			assert.ok(result.error instanceof DatabaseValidationError);
		});

		test("Should return 'DatabaseTimeoutError' when 'db.find({userId})' throws 'MongoNetworkTimeoutError'", async (t) => {
			// Arrange
			const timeoutError = new mongoose.mongo.MongoNetworkTimeoutError(
				"Timeout",
			);

			t.mock.method(Order, "find", () => {
				throw timeoutError;
			});

			// Act
			const result = await repo.getAllByUserId({ userId });

			// Assert
			assert.strictEqual(result.success, false);
			assert.ok(result.error instanceof DatabaseTimeoutError);
		});

		test("Should return 'DatabaseQueryError' when 'db.find({userId})' throws 'MongooseError'", async (t) => {
			// Arrange
			const queryError = new mongoose.Error("Query failed");

			t.mock.method(Order, "find", () => {
				throw queryError;
			});

			// Act
			const result = await repo.getAllByUserId({ userId });

			// Assert
			assert.strictEqual(result.success, false);
			assert.ok(result.error instanceof DatabaseQueryError);
		});

		test("Should return 'DatabaseNetworkError' when 'db.find({userId})' throws 'MongoError'", async (t) => {
			// Arrange
			const networkError = new mongoose.mongo.MongoError("Network error");

			t.mock.method(Order, "find", () => {
				throw networkError;
			});

			// Act
			const result = await repo.getAllByUserId({ userId });

			// Assert
			assert.strictEqual(result.success, false);
			assert.ok(result.error instanceof DatabaseNetworkError);
		});

		test("Should return 'GenericDatabaseError' when 'db.find({userId})' throws unknown error", async (t) => {
			// Arrange
			const unknownError = new Error("Something unexpected happened");

			t.mock.method(Order, "find", () => {
				throw unknownError;
			});

			// Act
			const result = await repo.getAllByUserId({ userId });

			// Assert
			assert.strictEqual(result.success, false);
			assert.ok(result.error instanceof GenericDatabaseError);
		});
	});

	describe("getById", () => {
		const mockOrder = generateMockSelectOrder();
		const orderId = mockOrder._id;

		test("Should return the order object when 'db.findById' is called once with 'orderId'", async (t) => {
			// Arrange
			const findByIdMock = t.mock.method(Order, "findById", () => ({
				populate: () => ({
					lean: async () => mockOrder,
				}),
			}));

			// Act
			const order = await repo.getById({ orderId });

			// Assert
			assert.ok(order);
			assert.strictEqual(order.success, true);
			assert.deepStrictEqual(order.data, mockOrder);

			assert.strictEqual(findByIdMock.mock.callCount(), 1);
			assert.deepStrictEqual(findByIdMock.mock.calls[0].arguments[0], orderId);
		});

		test("Should return 'null' when 'db.findById' returns 'null'", async (t) => {
			// Arrange
			t.mock.method(Order, "findById", () => ({
				populate: () => ({
					lean: async () => null,
				}),
			}));

			// Act
			const order = await repo.getById({ orderId });

			// Assert
			assert.ok(order);
			assert.strictEqual(order.success, true);
			assert.strictEqual(order.data, null);
		});

		test("Should return 'DatabaseValidationError' when 'db.findById' throws 'ValidationError'", async (t) => {
			// Arrange
			const validationError = new mongoose.Error.ValidationError();

			t.mock.method(Order, "findById", () => {
				throw validationError;
			});

			// Act
			const order = await repo.getById({ orderId });

			// Assert
			assert.strictEqual(order.success, false);
			assert.ok(order.error instanceof DatabaseValidationError);
		});

		test("Should return 'DatabaseTimeoutError' when 'db.findById' throws 'MongoNetworkTimeoutError'", async (t) => {
			// Arrange
			const timeoutError = new mongoose.mongo.MongoNetworkTimeoutError(
				"Timeout",
			);

			t.mock.method(Order, "findById", () => {
				throw timeoutError;
			});

			// Act
			const order = await repo.getById({ orderId });

			// Assert
			assert.strictEqual(order.success, false);
			assert.ok(order.error instanceof DatabaseTimeoutError);
		});

		test("Should return 'DatabaseQueryError' when 'db.findById' throws 'MongooseError'", async (t) => {
			// Arrange
			const queryError = new mongoose.Error("Query failed");

			t.mock.method(Order, "findById", () => {
				throw queryError;
			});

			// Act
			const order = await repo.getById({ orderId });

			// Assert
			assert.strictEqual(order.success, false);
			assert.ok(order.error instanceof DatabaseQueryError);
		});

		test("Should return 'DatabaseNetworkError' when 'db.findById' throws 'MongoError'", async (t) => {
			// Arrange
			const networkError = new mongoose.mongo.MongoError("Network error");

			t.mock.method(Order, "findById", () => {
				throw networkError;
			});

			// Act
			const order = await repo.getById({ orderId });

			// Assert
			assert.strictEqual(order.success, false);
			assert.ok(order.error instanceof DatabaseNetworkError);
		});

		test("Should return 'GenericDatabaseError' when 'db.findById' throws unknown error", async (t) => {
			// Arrange
			const unknownError = new Error("Something unexpected happened");

			t.mock.method(Order, "findById", () => {
				throw unknownError;
			});

			// Act
			const order = await repo.getById({ orderId });

			// Assert
			assert.strictEqual(order.success, false);
			assert.ok(order.error instanceof GenericDatabaseError);
		});
	});

	describe("updateToPaid", () => {
		const mockOrder = generateMockSelectOrder();
		const orderId = mockOrder._id;

		test("Should return the order object with 'isPaid' set to 'true' and 'paidAt' set to the current date when 'db.findByIdAndUpdate' is called once with 'orderId'", async (t) => {
			// Arrange
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

			// Act
			const updatedOrder = await repo.updateToPaid({ orderId });

			// Assert
			assert.ok(updatedOrder);
			assert.strictEqual(updatedOrder.success, true);
			assert.deepStrictEqual(updatedOrder.data, mockOrder);

			assert.strictEqual(mockFindByIdAndUpdate.mock.callCount(), 1);
			assert.deepStrictEqual(mockFindByIdAndUpdate.mock.calls[0].arguments[1], {
				$set: {
					isPaid: true,
					paidAt: new Date(),
				},
			});
		});

		test("Should return 'null' when 'db.findByIdAndUpdate' returns 'null'", async (t) => {
			// Arrange
			t.mock.method(Order, "findByIdAndUpdate", () => ({
				lean: async () => null,
			}));

			// Act
			const updatedOrder = await repo.updateToPaid({ orderId });

			// Assert
			assert.ok(updatedOrder);
			assert.strictEqual(updatedOrder.success, true);
			assert.strictEqual(updatedOrder.data, null);
		});

		test("Should return 'DatabaseValidationError' when 'db.findByIdAndUpdate' throws 'ValidationError'", async (t) => {
			// Arrange
			const validationError = new mongoose.Error.ValidationError();

			t.mock.method(Order, "findByIdAndUpdate", () => {
				throw validationError;
			});

			// Act
			const updatedOrder = await repo.updateToPaid({ orderId });

			// Assert
			assert.strictEqual(updatedOrder.success, false);
			assert.ok(updatedOrder.error instanceof DatabaseValidationError);
		});

		test("Should return 'DatabaseTimeoutError' when 'db.findByIdAndUpdate' throws 'MongoNetworkTimeoutError'", async (t) => {
			// Arrange
			const timeoutError = new mongoose.mongo.MongoNetworkTimeoutError(
				"Timeout",
			);

			t.mock.method(Order, "findByIdAndUpdate", () => {
				throw timeoutError;
			});

			// Act
			const updatedOrder = await repo.updateToPaid({ orderId });

			// Assert
			assert.strictEqual(updatedOrder.success, false);
			assert.ok(updatedOrder.error instanceof DatabaseTimeoutError);
		});

		test("Should return 'DatabaseQueryError' when 'db.findByIdAndUpdate' throws 'MongooseError'", async (t) => {
			// Arrange
			const queryError = new mongoose.Error("Query failed");

			t.mock.method(Order, "findByIdAndUpdate", () => {
				throw queryError;
			});

			// Act
			const updatedOrder = await repo.updateToPaid({ orderId });

			// Assert
			assert.strictEqual(updatedOrder.success, false);
			assert.ok(updatedOrder.error instanceof DatabaseQueryError);
		});

		test("Should return 'DatabaseNetworkError' when 'db.findByIdAndUpdate' throws 'MongoError'", async (t) => {
			// Arrange
			const networkError = new mongoose.mongo.MongoError("Network error");

			t.mock.method(Order, "findByIdAndUpdate", () => {
				throw networkError;
			});

			// Act
			const updatedOrder = await repo.updateToPaid({ orderId });

			// Assert
			assert.strictEqual(updatedOrder.success, false);
			assert.ok(updatedOrder.error instanceof DatabaseNetworkError);
		});

		test("Should return 'GenericDatabaseError' when 'db.findByIdAndUpdate' throws unknown error", async (t) => {
			// Arrange
			const unknownError = new Error("Something unexpected happened");

			t.mock.method(Order, "findByIdAndUpdate", () => {
				throw unknownError;
			});

			// Act
			const updatedOrder = await repo.updateToPaid({ orderId });

			// Assert
			assert.strictEqual(updatedOrder.success, false);
			assert.ok(updatedOrder.error instanceof GenericDatabaseError);
		});
	});

	describe("updateToDelivered", () => {
		const mockOrder = generateMockSelectOrder();
		const orderId = mockOrder._id;

		test("Should return the order object with 'isDelivered' set to 'true' and 'deliveredAt' set to the current date when 'db.findByIdAndUpdate' is called once with 'orderId'", async (t) => {
			// Arrange
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

			// Act
			const updatedOrder = await repo.updateToDelivered({ orderId });

			// Assert
			assert.ok(updatedOrder);
			assert.strictEqual(updatedOrder.success, true);
			assert.deepStrictEqual(updatedOrder.data, mockOrder);

			assert.strictEqual(mockFindByIdAndUpdate.mock.callCount(), 1);
			assert.deepStrictEqual(mockFindByIdAndUpdate.mock.calls[0].arguments[1], {
				$set: {
					deliveredAt: new Date(),
					isDelivered: true,
				},
			});
		});

		test("Should return 'null' when 'db.findByIdAndUpdate' returns 'null'", async (t) => {
			// Arrange
			t.mock.method(Order, "findByIdAndUpdate", () => ({
				lean: async () => null,
			}));

			const updatedOrder = await repo.updateToDelivered({ orderId });

			// Assert
			assert.ok(updatedOrder);
			assert.strictEqual(updatedOrder.success, true);
			assert.strictEqual(updatedOrder.data, null);
		});

		test("Should return 'DatabaseValidationError' when 'db.findByIdAndUpdate' throws 'ValidationError'", async (t) => {
			// Arrange
			const validationError = new mongoose.Error.ValidationError();

			t.mock.method(Order, "findByIdAndUpdate", () => {
				throw validationError;
			});

			// Act
			const updatedOrder = await repo.updateToDelivered({ orderId });

			// Assert
			assert.strictEqual(updatedOrder.success, false);
			assert.ok(updatedOrder.error instanceof DatabaseValidationError);
		});

		test("Should return 'DatabaseTimeoutError' when 'db.findByIdAndUpdate' throws 'MongoNetworkTimeoutError'", async (t) => {
			// Arrange
			const timeoutError = new mongoose.mongo.MongoNetworkTimeoutError(
				"Timeout",
			);

			t.mock.method(Order, "findByIdAndUpdate", () => {
				throw timeoutError;
			});

			// Act
			const updatedOrder = await repo.updateToDelivered({ orderId });

			// Assert
			assert.strictEqual(updatedOrder.success, false);
			assert.ok(updatedOrder.error instanceof DatabaseTimeoutError);
		});

		test("Should return 'DatabaseQueryError' when 'db.findByIdAndUpdate' throws 'MongooseError'", async (t) => {
			// Arrange
			const queryError = new mongoose.Error("Query failed");

			t.mock.method(Order, "findByIdAndUpdate", () => {
				throw queryError;
			});

			// Act
			const updatedOrder = await repo.updateToDelivered({ orderId });

			// Assert
			assert.strictEqual(updatedOrder.success, false);
			assert.ok(updatedOrder.error instanceof DatabaseQueryError);
		});

		test("Should return 'DatabaseNetworkError' when 'db.findByIdAndUpdate' throws 'MongoError'", async (t) => {
			// Arrange
			const networkError = new mongoose.mongo.MongoError("Network error");

			t.mock.method(Order, "findByIdAndUpdate", () => {
				throw networkError;
			});

			// Act
			const updatedOrder = await repo.updateToDelivered({ orderId });

			// Assert
			assert.strictEqual(updatedOrder.success, false);
			assert.ok(updatedOrder.error instanceof DatabaseNetworkError);
		});

		test("Should return 'GenericDatabaseError' when 'db.findByIdAndUpdate' throws unknown error", async (t) => {
			// Arrange
			const unknownError = new Error("Something unexpected happened");

			t.mock.method(Order, "findByIdAndUpdate", () => {
				throw unknownError;
			});

			// Act
			const updatedOrder = await repo.updateToDelivered({ orderId });

			// Assert
			assert.strictEqual(updatedOrder.success, false);
			assert.ok(updatedOrder.error instanceof GenericDatabaseError);
		});
	});
});
