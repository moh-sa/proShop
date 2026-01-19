import assert from "node:assert";
import { after, before, beforeEach, describe, suite, test } from "node:test";

import type { AllProducts, InsertProduct } from "../../types/index.js";

import { ProductController } from "../../controllers/index.js";
import { NotFoundError } from "../../errors/index.js";
import { ProductManager } from "../../managers/index.js";
import Product from "../../models/product.model.js";
import { ProductRepository } from "../../repositories/index.js";
import { CacheService, ProductService } from "../../services/index.js";
import {
	generateMockInsertProductWithMulterImage,
	generateMockObjectId,
	generateMockSelectProduct,
	generateMockSelectProducts,
	generateMockSelectUser,
	mockImageStorage,
} from "../mocks/index.js";
import {
	connectTestDatabase,
	disconnectTestDatabase,
} from "../utils/database-connection.utils.js";
import { createMockExpressContext } from "../utils/index.js";

suite("Product Controller 〖 Integration Tests 〗", () => {
	const cache = new CacheService("product");
	const repo = new ProductRepository(Product, cache);
	const storage = mockImageStorage();
	const service = new ProductService(repo);
	const manager = new ProductManager(service, storage);
	const controller = new ProductController(manager);

	before(async () => await connectTestDatabase());
	after(async () => await disconnectTestDatabase());

	beforeEach(async () => {
		await Product.deleteMany({});
		await cache.flush();
		storage.reset();
	});

	function mockImageUpload() {
		storage.upload.mock.mockImplementationOnce(() =>
			Promise.resolve({
				data: "http://example.com/image.jpg",
				success: true,
			}),
		);
	}

	describe("create", () => {
		test("Should return success response when 'service.create' is called with valid data", async () => {
			// Arrange
			const mockUser = generateMockSelectUser();
			const { image, ...mockProduct } =
				generateMockInsertProductWithMulterImage();

			const { next, req, res } = createMockExpressContext();
			req.body = mockProduct;
			// @ts-expect-error - `req.file` expect the type to be diskStorage
			req.file = image;
			res.locals.user = mockUser;

			mockImageUpload();

			// Act
			await controller.create(req, res, next);

			// Assert
			const response = res._getJSONData();
			assert.ok(response);
			assert.ok(response.success);
			assert.ok(response.data);
		});

		test("Should return '201' status code when 'service.create' is called with valid data", async () => {
			// Arrange
			const mockUser = generateMockSelectUser();
			const { image, ...mockProduct } =
				generateMockInsertProductWithMulterImage();

			const { next, req, res } = createMockExpressContext();
			req.body = mockProduct;
			// @ts-expect-error - `req.file` expect the type to be diskStorage
			req.file = image;
			res.locals.user = mockUser;

			mockImageUpload();

			// Act
			await controller.create(req, res, next);

			// Assert
			assert.strictEqual(res._getStatusCode(), 201);
		});

		test("Should create product when 'service.create' is called with valid data", async () => {
			// Arrange
			const mockUser = generateMockSelectUser();
			const { image, ...mockProduct } =
				generateMockInsertProductWithMulterImage();

			const { next, req, res } = createMockExpressContext();
			req.body = mockProduct;
			// @ts-expect-error - `req.file` expect the type to be diskStorage
			req.file = image;
			res.locals.user = mockUser;

			mockImageUpload();

			// Act
			await controller.create(req, res, next);

			// Assert
			const response = res._getJSONData();
			assert.ok(response);
			assert.ok(response.data);
			assert.ok(response.data._id);
			assert.strictEqual(response.data.user, mockUser._id.toString());
			assert.strictEqual(response.data.name, mockProduct.name);
			assert.strictEqual(response.data.brand, mockProduct.brand);
			assert.strictEqual(response.data.category, mockProduct.category);
			assert.strictEqual(response.data.description, mockProduct.description);
			assert.strictEqual(response.data.price, mockProduct.price);
			assert.strictEqual(response.data.countInStock, mockProduct.countInStock);
		});
	});

	describe("getAll", () => {
		test("Should return success response when 'service.getAll' is called with valid data", async () => {
			// Arrange
			const mockProducts = generateMockSelectProducts({ count: 3 });
			await Product.insertMany(mockProducts);

			const { next, req, res } = createMockExpressContext();

			// Act
			await controller.getAll(req, res, next);

			// Assert
			const response = res._getJSONData();
			assert.ok(response.success);
			assert.ok(response.data);
			assert.ok(response.meta);
			assert.strictEqual(response.data.length, mockProducts.length);
		});

		test("Should return '200' status code when 'service.getAll' is called with valid data", async () => {
			// Arrange
			const { next, req, res } = createMockExpressContext();

			// Act
			await controller.getAll(req, res, next);

			// Assert
			const code = res._getStatusCode();
			assert.strictEqual(code, 200);
		});

		test("Should return 'meta data' containing pagination information when 'service.getAll' is called with valid data", async () => {
			// Arrange
			const { next, req, res } = createMockExpressContext();

			// Act
			await controller.getAll(req, res, next);

			// Assert
			const response = res._getJSONData();
			assert.ok(response.success);
			assert.ok(response.meta);
			assert.strictEqual(response.meta.currentPage, 1);
			assert.strictEqual(response.meta.pageSize, 10);
			assert.strictEqual(response.meta.totalItems, 0);
			assert.strictEqual(response.meta.totalPages, 1);
			assert.strictEqual(response.meta.hasNextPage, false);
			assert.strictEqual(response.meta.hasPreviousPage, false);
		});

		test("Should return array of products when 'service.getAll' is called with existing products", async () => {
			// Arrange
			const { next, req, res } = createMockExpressContext();
			const mockProducts = generateMockSelectProducts({ count: 3 });
			await Product.insertMany(mockProducts);

			// Act
			await controller.getAll(req, res, next);

			// Assert
			const response = res._getJSONData();
			assert.ok(response.success);
			assert.ok(response.data);
			assert.ok(Array.isArray(response.data));
			assert.strictEqual(response.data.length, mockProducts.length);
		});

		test("Should return filtered products when 'service.getAll' is called with keyword", async () => {
			// Arrange
			const { next, req, res } = createMockExpressContext();
			const mockProducts = generateMockSelectProducts({ count: 20 });
			const targetProduct = mockProducts[0];
			const keyword = targetProduct.name;

			await Product.insertMany(mockProducts);
			req.query = { keyword };

			// Act
			await controller.getAll(req, res, next);

			// Assert
			const response = res._getJSONData();
			assert.ok(response.success);
			assert.ok(response.data);
			assert.ok(response.data.length > 0);
			assert.strictEqual(
				response.data.some((p: AllProducts) => p.name === keyword),
				true,
			);
		});

		test("Should return '10' products in 'page 1' when 'service.getAll' is called with 13 products in database", async () => {
			// Arrange
			const { next, req, res } = createMockExpressContext();
			const mockProducts = generateMockSelectProducts({ count: 13 });
			await Product.insertMany(mockProducts);
			req.query = { pageNumber: "1" };

			// Act
			await controller.getAll(req, res, next);

			// Assert
			const response = res._getJSONData();
			assert.ok(response.success);
			assert.ok(response.data);
			assert.strictEqual(response.data.length, 10);
			assert.strictEqual(response.meta.currentPage, 1);
			assert.strictEqual(response.meta.totalPages, 2);
			assert.strictEqual(response.meta.hasNextPage, true);
			assert.strictEqual(response.meta.hasPreviousPage, false);
		});

		test("Should return '3' products in 'page 2' when 'service.getAll' is called with 13 products in database", async () => {
			// Arrange
			const { next, req, res } = createMockExpressContext();
			const mockProducts = generateMockSelectProducts({ count: 13 });
			await Product.insertMany(mockProducts);
			req.query = { pageNumber: "2" };

			// Act
			await controller.getAll(req, res, next);

			// Assert
			const response = res._getJSONData();
			assert.ok(response.success);
			assert.ok(response.data);
			assert.strictEqual(response.data.length, 3);
			assert.strictEqual(response.meta.currentPage, 2);
			assert.strictEqual(response.meta.totalPages, 2);
			assert.strictEqual(response.meta.hasNextPage, false);
			assert.strictEqual(response.meta.hasPreviousPage, true);
		});

		test("Should return 'empty array' when 'service.getAll' is called with no products in database", async () => {
			// Arrange
			const { next, req, res } = createMockExpressContext();

			// Act
			await controller.getAll(req, res, next);

			// Assert
			const response = res._getJSONData();
			assert.ok(response.success);
			assert.ok(response.data);
			assert.strictEqual(response.data.length, 0);
		});

		test("Should return products with custom page size when 'service.getAll' is called with pageSize parameter", async () => {
			// Arrange
			const { next, req, res } = createMockExpressContext();
			const mockProducts = generateMockSelectProducts({ count: 15 });
			await Product.insertMany(mockProducts);
			req.query = { pageSize: "5" };

			// Act
			await controller.getAll(req, res, next);

			// Assert
			const response = res._getJSONData();
			assert.ok(response.success);
			assert.ok(response.data);
			assert.strictEqual(response.data.length, 5);
			assert.strictEqual(response.meta.pageSize, 5);
			assert.strictEqual(response.meta.totalPages, 3);
		});

		test("Should return products sorted by name when 'service.getAll' is called with sort parameter", async () => {
			// Arrange
			const { next, req, res } = createMockExpressContext();
			const mockProducts = generateMockSelectProducts({ count: 3 });
			// Set specific names for sorting test
			mockProducts[0].name = "Zebra Product";
			mockProducts[1].name = "Apple Product";
			mockProducts[2].name = "Banana Product";
			await Product.insertMany(mockProducts);
			req.query = { sort: "name:asc" };

			// Act
			await controller.getAll(req, res, next);

			// Assert
			const response = res._getJSONData();
			assert.ok(response.success);
			assert.ok(response.data);
			assert.strictEqual(response.data.length, 3);
			assert.strictEqual(response.data[0].name, "Apple Product");
			assert.strictEqual(response.data[1].name, "Banana Product");
			assert.strictEqual(response.data[2].name, "Zebra Product");
		});
	});

	describe("getTopRated", () => {
		test("Should return success response when 'service.getTopRated' is called with valid data", async () => {
			// Arrange
			const { next, req, res } = createMockExpressContext();
			const mockProducts = generateMockSelectProducts({ count: 3 });
			await Product.insertMany(mockProducts);

			// Act
			await controller.getTopRated(req, res, next);

			// Assert
			const response = res._getJSONData();
			assert.ok(response);
			assert.ok(response.success);
			assert.ok(response.data);
			assert.strictEqual(response.data.length, mockProducts.length);
		});

		test("Should return '200' status code when 'service.getTopRated' is called with valid data", async () => {
			// Arrange
			const { next, req, res } = createMockExpressContext();
			const mockProducts = generateMockSelectProducts({ count: 3 });
			await Product.insertMany(mockProducts);

			// Act
			await controller.getTopRated(req, res, next);

			// Assert
			const code = res._getStatusCode();
			assert.strictEqual(code, 200);
		});

		test("Should return array of top rated products when 'service.getTopRated' is called with valid data", async () => {
			// Arrange
			const { next, req, res } = createMockExpressContext();
			const mockProducts = generateMockSelectProducts({ count: 3 });
			await Product.insertMany(mockProducts);

			// Act
			await controller.getTopRated(req, res, next);

			// Assert
			const response = res._getJSONData();
			assert.ok(response);
			assert.ok(response.data);
			assert.ok(Array.isArray(response.data));
			assert.strictEqual(response.data.length, mockProducts.length);
		});

		test("Should return 'empty array' when 'service.getTopRated' is called with no products in database", async () => {
			// Arrange
			const { next, req, res } = createMockExpressContext();

			// Act
			await controller.getTopRated(req, res, next);

			// Assert
			const response = res._getJSONData();
			assert.ok(response);
			assert.strictEqual(response.data.length, 0);
		});
	});

	describe("getById", () => {
		test("Should return success response when 'service.getById' is called with valid data", async () => {
			// Arrange
			const { next, req, res } = createMockExpressContext();
			const mockProduct = generateMockSelectProduct();
			await Product.insertMany([mockProduct]);

			req.params = { productId: mockProduct._id.toString() };

			// Act
			await controller.getById(req, res, next);

			// Assert
			const response = res._getJSONData();
			assert.ok(response);
			assert.ok(response.success);
			assert.ok(response.data);
		});

		test("Should return '200' status code when 'service.getById' is called with valid data", async () => {
			// Arrange
			const { next, req, res } = createMockExpressContext();
			const mockProduct = generateMockSelectProduct();
			await Product.insertMany([mockProduct]);
			req.params = { productId: mockProduct._id.toString() };

			// Act
			await controller.getById(req, res, next);

			// Assert
			const code = res._getStatusCode();
			assert.strictEqual(code, 200);
		});

		test("Should return product object when 'service.getById' is called with existing product", async () => {
			// Arrange
			const { next, req, res } = createMockExpressContext();
			const mockProduct = generateMockSelectProduct();
			await Product.insertMany([mockProduct]);
			req.params = { productId: mockProduct._id.toString() };

			// Act
			await controller.getById(req, res, next);

			// Assert
			const response = res._getJSONData();
			assert.ok(response);
			assert.ok(response.data);
			assert.strictEqual(response.data.name, mockProduct.name);
			assert.strictEqual(response.data.brand, mockProduct.brand);
			assert.strictEqual(response.data.category, mockProduct.category);
			assert.strictEqual(response.data.description, mockProduct.description);
			assert.strictEqual(response.data.price, mockProduct.price);
			assert.strictEqual(response.data.countInStock, mockProduct.countInStock);
			assert.strictEqual(response.data.image, mockProduct.image);
			assert.strictEqual(response.data.rating, mockProduct.rating);
			assert.strictEqual(response.data.numReviews, mockProduct.numReviews);
		});

		test("Should throw 'NotFoundError' when 'service.getById' is called with non-existent product id", async () => {
			// Arrange
			const { next, req, res } = createMockExpressContext();
			const productId = generateMockObjectId();
			req.params = { productId: productId.toString() };

			// Act & Assert
			await assert.rejects(
				async () => await controller.getById(req, res, next),
				NotFoundError,
			);
		});
	});

	describe("update", () => {
		test("Should return success response when 'service.update' is called with valid data", async () => {
			// Arrange
			const { next, req, res } = createMockExpressContext();
			const mockProduct = generateMockSelectProduct();
			req.params = { productId: mockProduct._id.toString() };

			await Product.insertMany([mockProduct]);
			cache.set({ key: mockProduct._id.toString(), value: mockProduct });

			// Act
			await controller.update(req, res, next);

			// Assert
			const response = res._getJSONData();
			assert.ok(response);
			assert.ok(response.success);
			assert.ok(response.data);
		});

		test("Should return '200' status code when 'service.update' is called with valid data", async () => {
			// Arrange
			const { next, req, res } = createMockExpressContext();
			const mockProduct = generateMockSelectProduct();
			const productId = mockProduct._id.toString();

			req.params = { productId };

			await Product.insertMany([mockProduct]);
			cache.set({ key: productId, value: mockProduct });

			// Act
			await controller.update(req, res, next);

			// Assert
			const code = res._getStatusCode();
			assert.strictEqual(code, 200);
		});

		test("Should return updated product when 'service.update' is called with valid update data", async () => {
			// Arrange
			const { next, req, res } = createMockExpressContext();
			const mockProduct = generateMockSelectProduct();
			const productId = mockProduct._id.toString();

			const updateData: Partial<InsertProduct> = { name: "UPDATED NAME" };

			req.params = { productId };
			req.body = updateData;

			await Product.insertMany([mockProduct]);
			cache.set({ key: productId, value: mockProduct });

			// Act
			await controller.update(req, res, next);

			// Assert
			const response = res._getJSONData();
			assert.ok(response);
			assert.strictEqual(response.data.name, updateData.name);
		});

		test("Should throw 'NotFoundError' when 'service.update' is called with non-existent product id", async () => {
			// Arrange
			const { next, req, res } = createMockExpressContext();
			const productId = generateMockObjectId().toString();
			req.params = { productId };

			// Act & Assert
			await assert.rejects(
				async () => await controller.update(req, res, next),
				NotFoundError,
			);
		});
	});

	describe("delete", () => {
		test("Should return success response when 'service.delete' is called with valid data", async () => {
			// Arrange
			const { next, req, res } = createMockExpressContext();
			const mockProduct = generateMockSelectProduct();
			const productId = mockProduct._id.toString();

			req.params = { productId };

			await Product.insertMany([mockProduct]);
			cache.set({ key: productId, value: mockProduct });

			storage.delete.mock.mockImplementationOnce(() =>
				Promise.resolve({ data: undefined, success: true }),
			);

			// Act
			await controller.delete(req, res, next);

			// Assert
			const response = res._getJSONData();
			assert.ok(response);
			assert.ok(response.success);
		});

		test("Should return '204' status code when 'service.delete' is called with valid data", async () => {
			// Arrange
			const { next, req, res } = createMockExpressContext();
			const mockProduct = generateMockSelectProduct();
			const productId = mockProduct._id.toString();

			req.params = { productId };

			await Product.insertMany([mockProduct]);
			cache.set({ key: productId, value: mockProduct });

			storage.delete.mock.mockImplementationOnce(() =>
				Promise.resolve({ data: undefined, success: true }),
			);

			// Act
			await controller.delete(req, res, next);

			// Assert
			const code = res._getStatusCode();
			assert.strictEqual(code, 204);
		});

		test("Should return 'data' equals to 'null' 'service.delete' is called with valid data", async () => {
			// Arrange
			const { next, req, res } = createMockExpressContext();
			const mockProduct = generateMockSelectProduct();
			const productId = mockProduct._id.toString();

			req.params = { productId };

			await Product.insertMany([mockProduct]);
			cache.set({ key: productId, value: mockProduct });

			storage.delete.mock.mockImplementationOnce(() =>
				Promise.resolve({ data: undefined, success: true }),
			);

			// Act
			await controller.delete(req, res, next);

			// Assert
			const response = res._getJSONData();
			assert.ok(response);
			assert.strictEqual(response.data, null);
		});

		test("Should throw 'NotFoundError' when 'service.delete' is called with non-existent product id", async () => {
			// Arrange
			const { next, req, res } = createMockExpressContext();
			const productId = generateMockObjectId().toString();
			req.params = { productId };

			// Act & Assert
			await assert.rejects(
				async () => await controller.delete(req, res, next),
				NotFoundError,
			);
		});
	});
});
