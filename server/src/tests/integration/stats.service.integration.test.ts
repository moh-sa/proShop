import assert from "node:assert";
import { after, before, beforeEach, describe, suite, test } from "node:test";

import { OrderModel } from "../../models/order.model.js";
import { ProductModel } from "../../models/product.model.js";
import { UserModel } from "../../models/user.model.js";
import { StatsService } from "../../services/stats.service.js";
import {
	generateMockInsertOrder,
	generateMockInsertOrders,
	generateMockInsertProductWithStringImage,
	generateMockInsertUser,
} from "../mocks/index.js";
import {
	connectTestDatabase,
	createOrder,
	createOrders,
	createProduct,
	createUser,
	disconnectTestDatabase,
} from "../utils/index.js";

suite("StatsService 〖 Integration Tests 〗", async () => {
	let statsService: StatsService;

	before(async () => await connectTestDatabase());
	after(async () => await disconnectTestDatabase());

	beforeEach(async () => {
		statsService = new StatsService();
		await OrderModel.deleteMany({});
		await ProductModel.deleteMany({});
		await UserModel.deleteMany({});
	});

	describe("getStatsSummary", () => {
		test("Should always return 6 months of revenue even if the database is empty", async () => {
			// Act
			const result = await statsService.getStatsSummary();

			// Assert
			assert.strictEqual(result.success, true);
			assert.strictEqual(result.data.counts.orders, 0);
			assert.strictEqual(result.data.counts.products, 0);
			assert.strictEqual(result.data.counts.users, 0);
			assert.strictEqual(result.data.counts.revenue, 0);
			assert.strictEqual(result.data.recentOrders.length, 0);
			assert.strictEqual(result.data.revenueByMonth.length, 6);
			assert.strictEqual(result.data.lowStockProducts.length, 0);
		});

		test("Should return correct total order count", async () => {
			// Arrange
			await createOrders(generateMockInsertOrders(3));

			// Act
			const result = await statsService.getStatsSummary();

			// Assert
			assert.strictEqual(result.success, true);
			assert.strictEqual(result.data.counts.orders, 3);
		});

		test("Should return correct product count", async () => {
			// Arrange
			await Promise.all([
				createProduct(generateMockInsertProductWithStringImage()),
				createProduct(generateMockInsertProductWithStringImage()),
			]);

			// Act
			const result = await statsService.getStatsSummary();

			// Assert
			assert.strictEqual(result.success, true);
			assert.strictEqual(result.data.counts.products, 2);
		});

		test("Should return correct user count", async () => {
			// Arrange
			await Promise.all([
				createUser(generateMockInsertUser()),
				createUser(generateMockInsertUser()),
				createUser(generateMockInsertUser()),
			]);

			// Act
			const result = await statsService.getStatsSummary();

			// Assert
			assert.strictEqual(result.success, true);
			assert.strictEqual(result.data.counts.users, 3);
		});

		test("Should sum revenue only from processing and delivered orders", async () => {
			// Arrange
			const processingOrder = await createOrder(
				generateMockInsertOrder({ status: "processing", totalPrice: 5000 }),
			);
			const deliveredOrder = await createOrder(
				generateMockInsertOrder({ status: "delivered", totalPrice: 3000 }),
			);
			// These should not contribute to revenue
			await createOrder(
				generateMockInsertOrder({ status: "pending", totalPrice: 2000 }),
			);
			await createOrder(
				generateMockInsertOrder({ status: "cancelled", totalPrice: 1000 }),
			);

			const expectedRevenue =
				processingOrder.totalPrice + deliveredOrder.totalPrice;

			// Act
			const result = await statsService.getStatsSummary();

			// Assert
			assert.strictEqual(result.success, true);
			assert.strictEqual(result.data.counts.revenue, expectedRevenue);
		});

		test("Should return at most 5 recent orders sorted by newest first", async () => {
			// Arrange
			await createOrders(generateMockInsertOrders(7));

			// Act
			const result = await statsService.getStatsSummary();

			// Assert
			assert.strictEqual(result.success, true);
			assert.strictEqual(result.data.recentOrders.length, 5);

			// Should be sorted newest first
			for (let i = 0; i < result.data.recentOrders.length - 1; i++) {
				assert.ok(
					result.data.recentOrders[i].createdAt >=
						result.data.recentOrders[i + 1].createdAt,
				);
			}
		});

		test("Should include required fields in recent orders", async () => {
			// Arrange
			await createOrder(generateMockInsertOrder({ status: "processing" }));

			// Act
			const result = await statsService.getStatsSummary();

			// Assert
			assert.strictEqual(result.success, true);
			assert.strictEqual(result.data.recentOrders.length, 1);

			const order = result.data.recentOrders[0];
			assert.ok(order.id);
			assert.ok(order.createdAt);
			assert.ok(order.status);
			assert.ok(typeof order.totalPrice === "number");
			assert.ok(order.user.id);
			assert.ok(order.user.name);
			assert.ok(order.user.email);
		});

		test("Should return only low-stock products (countInStock <= 5)", async () => {
			// Arrange
			await createProduct({
				...generateMockInsertProductWithStringImage(),
				countInStock: 2,
			});
			await createProduct({
				...generateMockInsertProductWithStringImage(),
				countInStock: 5,
			});
			await createProduct({
				...generateMockInsertProductWithStringImage(),
				countInStock: 10,
			});

			// Act
			const result = await statsService.getStatsSummary();

			// Assert
			assert.strictEqual(result.success, true);
			assert.strictEqual(result.data.lowStockProducts.length, 2);
			result.data.lowStockProducts.forEach((p) => {
				assert.ok(p.countInStock <= 5);
			});
		});

		test("Should include required fields in low-stock products", async () => {
			// Arrange
			await createProduct({
				...generateMockInsertProductWithStringImage(),
				countInStock: 1,
			});

			// Act
			const result = await statsService.getStatsSummary();

			// Assert
			assert.strictEqual(result.success, true);
			assert.strictEqual(result.data.lowStockProducts.length, 1);

			const product = result.data.lowStockProducts[0];
			assert.ok(product.id);
			assert.ok(product.name);
			assert.ok(product.image);
			assert.ok(typeof product.countInStock === "number");
		});
	});
});
