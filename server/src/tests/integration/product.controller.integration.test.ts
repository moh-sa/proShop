import assert from "node:assert";
import { after, before, beforeEach, describe, suite, test } from "node:test";

import { ProductController } from "../../controllers/index.js";
import { NotFoundError } from "../../errors/index.js";
import { ProductManager } from "../../managers/index.js";
import { ProductModel } from "../../models/product.model.js";
import { ProductRepository } from "../../repositories/index.js";
import { CacheService, ProductService } from "../../services/index.js";
import type {
	AllProducts,
	UpdateProductUploadInput,
} from "../../types/index.js";
import {
	generateMockInsertProductsWithStringImage,
	generateMockInsertProductWithMulterImage,
	generateMockInsertProductWithStringImage,
	generateMockObjectId,
	generateMockSelectUser,
	mockImageStorage,
} from "../mocks/index.js";
import {
	connectTestDatabase,
	createMockExpressContextFromHandler,
	createProduct,
	createProducts,
	disconnectTestDatabase,
	toCents,
	toDollars,
} from "../utils/index.js";

suite("Product Controller 〖 Integration Tests 〗", () => {
	const cache = new CacheService("product");
	const repo = new ProductRepository(ProductModel, cache);
	const storage = mockImageStorage();
	const service = new ProductService(repo);
	const manager = new ProductManager(service, storage);
	const controller = new ProductController(manager);

	before(async () => await connectTestDatabase());
	after(async () => await disconnectTestDatabase());

	beforeEach(async () => {
		await ProductModel.deleteMany({});
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

			const { next, req, res } = createMockExpressContextFromHandler(
				controller.create,
			);
			req.body = mockProduct;
			// @ts-expect-error - `req.file` expect the type to be diskStorage
			req.file = image;
			res.locals.user = mockUser;

			mockImageUpload();

			// Act
			await controller.create(req, res, next);

			// Assert
			const response = res._getJSONData();
			assert.ok(response.success);
			assert.ok(response.data);
		});

		test("Should return '201' status code when 'service.create' is called with valid data", async () => {
			// Arrange
			const mockUser = generateMockSelectUser();
			const { image, ...mockProduct } =
				generateMockInsertProductWithMulterImage();

			const { next, req, res } = createMockExpressContextFromHandler(
				controller.create,
			);
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

			const { next, req, res } = createMockExpressContextFromHandler(
				controller.create,
			);
			req.body = mockProduct;
			// @ts-expect-error - `req.file` expect the type to be diskStorage
			req.file = image;
			res.locals.user = mockUser;

			mockImageUpload();

			// Act
			await controller.create(req, res, next);

			// Assert
			const response = res._getJSONData();
			assert.ok(response.success);
			assert.ok(response.data);
			assert.ok(response.data.id);
			assert.strictEqual(response.data.userId, mockUser.id);
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
			const createdProducts = await createProducts(
				generateMockInsertProductsWithStringImage({
					count: 3,
				}),
			);

			const { next, req, res } = createMockExpressContextFromHandler(
				controller.getAll,
			);

			// Act
			await controller.getAll(req, res, next);

			// Assert
			const response = res._getJSONData();
			assert.ok(response.success);
			assert.ok(response.data);
			assert.ok(response.meta);
			assert.strictEqual(response.data.length, createdProducts.length);
		});

		test("Should return '200' status code when 'service.getAll' is called with valid data", async () => {
			// Arrange
			const { next, req, res } = createMockExpressContextFromHandler(
				controller.getAll,
			);

			// Act
			await controller.getAll(req, res, next);

			// Assert
			const code = res._getStatusCode();
			assert.strictEqual(code, 200);
		});

		test("Should return 'meta data' containing pagination information when 'service.getAll' is called with valid data", async () => {
			// Arrange
			const { next, req, res } = createMockExpressContextFromHandler(
				controller.getAll,
			);

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
			const { next, req, res } = createMockExpressContextFromHandler(
				controller.getAll,
			);

			const createdProducts = await createProducts(
				generateMockInsertProductsWithStringImage({
					count: 3,
				}),
			);

			// Act
			await controller.getAll(req, res, next);

			// Assert
			const response = res._getJSONData();
			assert.ok(response.success);
			assert.ok(response.data);
			assert.ok(Array.isArray(response.data));
			assert.strictEqual(response.data.length, createdProducts.length);
		});

		test("Should return filtered products when 'service.getAll' is called with keyword", async () => {
			// Arrange
			const { next, req, res } = createMockExpressContextFromHandler(
				controller.getAll,
			);

			const createdProducts = await createProducts(
				generateMockInsertProductsWithStringImage({
					count: 20,
				}),
			);

			const targetProduct = createdProducts[0];
			const keyword = targetProduct.name.split(" ")[0];

			req.query = { keyword, pageNumber: "1", pageSize: "10" };

			// Act
			await controller.getAll(req, res, next);

			// Assert
			const response = res._getJSONData();
			assert.ok(response.success);
			assert.ok(response.data);
			assert.ok(response.data.length > 0);

			assert.ok(response.data.some((p) => p.id === targetProduct.id));
		});

		test("Should return '10' products in 'page 1' when 'service.getAll' is called with 13 products in database", async () => {
			// Arrange
			const { next, req, res } = createMockExpressContextFromHandler(
				controller.getAll,
			);

			await createProducts(
				generateMockInsertProductsWithStringImage({
					count: 13,
				}),
			);

			req.query = { pageNumber: "1", pageSize: "10" };

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
			const { next, req, res } = createMockExpressContextFromHandler(
				controller.getAll,
			);

			await createProducts(
				generateMockInsertProductsWithStringImage({
					count: 13,
				}),
			);

			req.query = { pageNumber: "2", pageSize: "10" };

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
			const { next, req, res } = createMockExpressContextFromHandler(
				controller.getAll,
			);

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
			const { next, req, res } = createMockExpressContextFromHandler(
				controller.getAll,
			);

			await createProducts(
				generateMockInsertProductsWithStringImage({
					count: 15,
				}),
			);

			req.query = { pageNumber: "1", pageSize: "5" };

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

		test("Should return products sorted by price when 'service.getAll' is called with sort parameter", async () => {
			// Arrange
			const { next, req, res } = createMockExpressContextFromHandler(
				controller.getAll,
			);

			const createdProducts = await createProducts(
				generateMockInsertProductsWithStringImage({
					count: 3,
				}).map((p) => ({
					...p,
					price: toCents(p.price),
				})),
			);

			const expectedSortedProducts = createdProducts
				.map((p) => ({
					...p,
					price: toDollars(p.price),
				}))
				.sort((a, b) => a.price - b.price);

			req.query = { sort: "price:asc", pageNumber: "1", pageSize: "10" };

			// Act
			await controller.getAll(req, res, next);

			// Assert
			const response = res._getJSONData();
			assert.ok(response.success);
			assert.ok(response.data);
			assert.strictEqual(response.data.length, 3);
			response.data.forEach((p: AllProducts, index: number) => {
				assert.strictEqual(p.price, expectedSortedProducts[index].price);
			});
		});

		test("Should return products filtered by brand when 'service.getAll' is called with brand query", async () => {
			// Arrange
			const { next, req, res } = createMockExpressContextFromHandler(
				controller.getAll,
			);

			const createdProducts = await createProducts(
				generateMockInsertProductsWithStringImage({
					count: 4,
				}),
			);

			const targetBrand = createdProducts[0].brand;

			req.query = { brand: targetBrand, pageNumber: "1", pageSize: "10" };

			// Act
			await controller.getAll(req, res, next);

			// Assert
			const response = res._getJSONData();
			assert.ok(response.success);
			assert.ok(response.data);
			response.data.forEach((p: AllProducts) => {
				assert.strictEqual(p.brand, targetBrand);
			});
		});

		test("Should return products filtered by category when 'service.getAll' is called with category query", async () => {
			// Arrange
			const { next, req, res } = createMockExpressContextFromHandler(
				controller.getAll,
			);

			const createdProducts = await createProducts(
				generateMockInsertProductsWithStringImage({
					count: 4,
				}),
			);

			const targetCategory = createdProducts[0].category;

			req.query = { category: targetCategory, pageNumber: "1", pageSize: "10" };

			// Act
			await controller.getAll(req, res, next);

			// Assert
			const response = res._getJSONData();
			assert.ok(response.success);
			assert.ok(response.data);

			response.data.forEach((p: AllProducts) => {
				assert.strictEqual(p.category, targetCategory);
			});
		});
	});

	describe("getTopRated", () => {
		test("Should return success response when 'service.getTopRated' is called with valid data", async () => {
			// Arrange
			const { next, req, res } = createMockExpressContextFromHandler(
				controller.getTopRated,
			);

			const createdProducts = await createProducts(
				generateMockInsertProductsWithStringImage({
					count: 3,
				}),
			);

			// Act
			await controller.getTopRated(req, res, next);

			// Assert
			const response = res._getJSONData();
			assert.ok(response.success);
			assert.ok(response.data);
			assert.strictEqual(response.data.length, createdProducts.length);
		});

		test("Should return '200' status code when 'service.getTopRated' is called with valid data", async () => {
			// Arrange
			const { next, req, res } = createMockExpressContextFromHandler(
				controller.getTopRated,
			);

			await createProducts(
				generateMockInsertProductsWithStringImage({
					count: 3,
				}),
			);

			// Act
			await controller.getTopRated(req, res, next);

			// Assert
			const code = res._getStatusCode();
			assert.strictEqual(code, 200);
		});

		test("Should return array of top rated products when 'service.getTopRated' is called with valid data", async () => {
			// Arrange
			const { next, req, res } = createMockExpressContextFromHandler(
				controller.getTopRated,
			);

			const createdProducts = await createProducts(
				generateMockInsertProductsWithStringImage({
					count: 3,
				}),
			);

			// Act
			await controller.getTopRated(req, res, next);

			// Assert
			const response = res._getJSONData();
			assert.ok(response.success);
			assert.ok(response.data);
			assert.ok(Array.isArray(response.data));
			assert.strictEqual(response.data.length, createdProducts.length);
		});

		test("Should return 'empty array' when 'service.getTopRated' is called with no products in database", async () => {
			// Arrange
			const { next, req, res } = createMockExpressContextFromHandler(
				controller.getTopRated,
			);

			// Act
			await controller.getTopRated(req, res, next);

			// Assert
			const response = res._getJSONData();
			assert.ok(response.success);
			assert.strictEqual(response.data.length, 0);
		});
	});

	describe("getById", () => {
		test("Should return success response when 'service.getById' is called with valid data", async () => {
			// Arrange
			const { next, req, res } = createMockExpressContextFromHandler(
				controller.getById,
			);

			const createdProduct = await createProduct(
				generateMockInsertProductWithStringImage(),
			);

			req.params = { productId: createdProduct.id };

			// Act
			await controller.getById(req, res, next);

			// Assert
			const response = res._getJSONData();
			assert.ok(response.success);
			assert.ok(response.data);
		});

		test("Should return '200' status code when 'service.getById' is called with valid data", async () => {
			// Arrange
			const { next, req, res } = createMockExpressContextFromHandler(
				controller.getById,
			);

			const createdProduct = await createProduct(
				generateMockInsertProductWithStringImage(),
			);

			req.params = { productId: createdProduct.id };

			// Act
			await controller.getById(req, res, next);

			// Assert
			const code = res._getStatusCode();
			assert.strictEqual(code, 200);
		});

		test("Should return product object when 'service.getById' is called with existing product", async () => {
			// Arrange
			const { next, req, res } = createMockExpressContextFromHandler(
				controller.getById,
			);

			const createdProduct = await createProduct(
				generateMockInsertProductWithStringImage(),
			);

			req.params = { productId: createdProduct.id };

			// Act
			await controller.getById(req, res, next);

			// Assert
			const response = res._getJSONData();
			assert.ok(response.success);
			assert.ok(response.data);

			const createdInDollars = {
				...createdProduct,
				price: toDollars(createdProduct.price),
			};
			assert.strictEqual(response.data.name, createdInDollars.name);
			assert.strictEqual(response.data.brand, createdInDollars.brand);
			assert.strictEqual(response.data.category, createdInDollars.category);
			assert.strictEqual(
				response.data.description,
				createdInDollars.description,
			);
			assert.strictEqual(response.data.price, createdInDollars.price);
			assert.strictEqual(
				response.data.countInStock,
				createdInDollars.countInStock,
			);
			assert.strictEqual(response.data.image, createdInDollars.image);
			assert.strictEqual(response.data.rating, createdInDollars.rating);
			assert.strictEqual(response.data.numReviews, createdInDollars.numReviews);
		});

		test("Should throw 'NotFoundError' when 'service.getById' is called with non-existent product id", async () => {
			// Arrange
			const { next, req, res } = createMockExpressContextFromHandler(
				controller.getById,
			);
			const productId = generateMockObjectId();
			req.params = { productId: productId };

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
			const { next, req, res } = createMockExpressContextFromHandler(
				controller.update,
			);

			const createdProduct = await createProduct(
				generateMockInsertProductWithStringImage(),
			);

			req.params = { productId: createdProduct.id };

			cache.set({ key: createdProduct.id, value: createdProduct });

			// Act
			await controller.update(req, res, next);

			// Assert
			const response = res._getJSONData();
			assert.ok(response.success);
			assert.ok(response.data);
		});

		test("Should return '200' status code when 'service.update' is called with valid data", async () => {
			// Arrange
			const { next, req, res } = createMockExpressContextFromHandler(
				controller.update,
			);

			const createdProduct = await createProduct(
				generateMockInsertProductWithStringImage(),
			);

			const productId = createdProduct.id;

			req.params = { productId };

			cache.set({ key: productId, value: createdProduct });

			// Act
			await controller.update(req, res, next);

			// Assert
			const code = res._getStatusCode();
			assert.strictEqual(code, 200);
		});

		test("Should return updated product when 'service.update' is called with valid update data", async () => {
			// Arrange
			const { next, req, res } = createMockExpressContextFromHandler(
				controller.update,
			);

			const createdProduct = await createProduct(
				generateMockInsertProductWithStringImage(),
			);

			const productId = createdProduct.id;

			const updateData: UpdateProductUploadInput = { name: "UPDATED NAME" };

			req.params = { productId };
			req.body = updateData;

			cache.set({ key: productId, value: createdProduct });

			// Act
			await controller.update(req, res, next);

			// Assert
			const response = res._getJSONData();
			assert.ok(response.success);
			assert.strictEqual(response.data.name, updateData.name);
		});

		test("Should throw 'NotFoundError' when 'service.update' is called with non-existent product id", async () => {
			// Arrange
			const { next, req, res } = createMockExpressContextFromHandler(
				controller.update,
			);
			const productId = generateMockObjectId();
			req.params = { productId };

			// Act & Assert
			await assert.rejects(
				async () => await controller.update(req, res, next),
				NotFoundError,
			);
		});
	});

	describe("delete", () => {
		test("Should return '204' with empty body when 'service.delete' is called with valid data", async () => {
			// Arrange
			const { next, req, res } = createMockExpressContextFromHandler(
				controller.delete,
			);

			const createdProduct = await createProduct(
				generateMockInsertProductWithStringImage(),
			);

			const productId = createdProduct.id;

			req.params = { productId };

			cache.set({ key: productId, value: createdProduct });

			storage.delete.mock.mockImplementationOnce(() =>
				Promise.resolve({ data: undefined, success: true }),
			);

			// Act
			await controller.delete(req, res, next);

			// Assert
			assert.strictEqual(res._getStatusCode(), 204);
			assert.strictEqual(res._getData(), "");
		});

		test("Should throw 'NotFoundError' when 'service.delete' is called with non-existent product id", async () => {
			// Arrange
			const { next, req, res } = createMockExpressContextFromHandler(
				controller.delete,
			);
			const productId = generateMockObjectId();
			req.params = { productId };

			// Act & Assert
			await assert.rejects(
				async () => await controller.delete(req, res, next),
				NotFoundError,
			);
		});
	});
});
