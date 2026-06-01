import assert from "node:assert";
import { after, before, beforeEach, describe, suite, test } from "node:test";

import { StatsController } from "../../controllers/stats.controller.js";
import { OrderModel } from "../../models/order.model.js";
import { ProductModel } from "../../models/product.model.js";
import { UserModel } from "../../models/user.model.js";
import {
	generateMockInsertOrder,
	generateMockInsertProductWithStringImage,
} from "../mocks/index.js";
import {
	connectTestDatabase,
	createMockExpressContextFromHandler,
	createOrder,
	createProduct,
	disconnectTestDatabase,
} from "../utils/index.js";

suite("StatsController 〖 Integration Tests 〗", () => {
	const controller = new StatsController();

	before(async () => await connectTestDatabase());
	after(async () => await disconnectTestDatabase());

	beforeEach(async () => {
		await OrderModel.deleteMany({});
		await ProductModel.deleteMany({});
		await UserModel.deleteMany({});
	});

	describe("getSummary", () => {
		test("Should return 200 with stats when database is empty", async () => {
			// Arrange
			const { next, req, res } = createMockExpressContextFromHandler(
				controller.getSummary,
			);

			// Act
			await controller.getSummary(req, res, next);

			// Assert
			const code = res._getStatusCode();
			assert.strictEqual(code, 200);

			const response = res._getJSONData();
			assert.ok(response.success);
			assert.ok(response.data);
			assert.ok(response.data.counts);
			assert.ok(Array.isArray(response.data.recentOrders));
			assert.ok(Array.isArray(response.data.revenueByMonth));
			assert.ok(Array.isArray(response.data.lowStockProducts));
		});

		test("Should return revenue converted from cents to dollars", async () => {
			// Arrange
			const priceInCents = 10000;
			await createOrder(
				generateMockInsertOrder({
					status: "processing",
					totalPrice: priceInCents,
				}),
			);

			const { next, req, res } = createMockExpressContextFromHandler(
				controller.getSummary,
			);

			// Act
			await controller.getSummary(req, res, next);

			// Assert
			const response = res._getJSONData();
			assert.ok(response.success);
			assert.strictEqual(response.data.counts.revenue, priceInCents / 100);
		});

		test("Should return correct order count in counts", async () => {
			// Arrange
			await createOrder(generateMockInsertOrder({ status: "pending" }));
			await createOrder(generateMockInsertOrder({ status: "processing" }));

			const { next, req, res } = createMockExpressContextFromHandler(
				controller.getSummary,
			);

			// Act
			await controller.getSummary(req, res, next);

			// Assert
			const response = res._getJSONData();
			assert.ok(response.success);
			assert.strictEqual(response.data.counts.orders, 2);
		});

		test("Should include low stock products in response", async () => {
			// Arrange
			await createProduct({
				...generateMockInsertProductWithStringImage(),
				countInStock: 0,
			});

			const { next, req, res } = createMockExpressContextFromHandler(
				controller.getSummary,
			);

			// Act
			await controller.getSummary(req, res, next);

			// Assert
			const response = res._getJSONData();
			assert.ok(response.success);
			assert.strictEqual(response.data.lowStockProducts.length, 1);
		});
	});
});
