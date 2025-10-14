import mongoose from "mongoose";
import assert from "node:assert";
import test, { beforeEach, describe, mock, suite } from "node:test";

import type { CacheService } from "../../services/index.js";
import type { InsertProductWithStringImage } from "../../types/index.js";

import {
	DatabaseNetworkError,
	DatabaseQueryError,
	DatabaseTimeoutError,
	DatabaseValidationError,
	GenericDatabaseError,
} from "../../errors/index.js";
import Product from "../../models/product.model.js";
import { ProductRepository } from "../../repositories/index.js";
import {
	generateMockInsertProductWithStringImage,
	generateMockSelectProduct,
	generateMockSelectProducts,
	mockCacheHit,
	mockCacheInvalidation,
	mockCacheMiss,
	mockCacheService,
	mockSetCache,
} from "../mocks/index.js";

suite("Product Repository 〖 Unit Tests 〗", () => {
	const mockCache = mockCacheService();
	const repo = new ProductRepository(
		Product,
		mockCache as unknown as CacheService,
	);

	beforeEach(() => mockCache.reset());

	describe("create", () => {
		const mockInsertProduct = generateMockInsertProductWithStringImage();
		const mockSelectProduct = {
			...generateMockSelectProduct(),
			...mockInsertProduct,
		};
		const productId = mockSelectProduct._id;
		const cacheKey = productId.toString();

		test("Should return product object when 'db.create' is called once with product data", async () => {
			// Arrange
			const mockCreate = mock.method(Product, "create", async () => ({
				toObject: () => mockSelectProduct,
			}));

			mockSetCache({ cacheKey, instance: mockCache });
			mockCacheInvalidation({ cacheKey, instance: mockCache });

			// Act
			const product = await repo.create(mockInsertProduct);

			// Assert
			assert.ok(product);
			assert.strictEqual(product.success, true);
			assert.deepStrictEqual(product.data, mockSelectProduct);

			assert.strictEqual(mockCreate.mock.callCount(), 1);
			assert.deepStrictEqual(
				mockCreate.mock.calls[0].arguments[0],
				mockInsertProduct,
			);
		});

		test("Should return product object when 'cache.get' is called once and returns 'true'", async () => {
			// Arrange
			mock.method(Product, "create", async () => ({
				toObject: () => mockSelectProduct,
			}));

			mockSetCache({ cacheKey, instance: mockCache });

			// Act
			await repo.create(mockInsertProduct);

			// Assert
			assert.strictEqual(mockCache.set.mock.callCount(), 1);
			assert.deepStrictEqual(mockCache.set.mock.calls[0].arguments[0], {
				key: cacheKey,
				value: mockSelectProduct,
			});
		});

		test("Should call 'cache.delete' two times", async (t) => {
			// Arrange
			mockSetCache({ cacheKey, instance: mockCache });

			mockCacheInvalidation({
				cacheKey,
				instance: mockCache,
			});

			t.mock.method(Product, "create", () => ({
				toObject: () => mockSelectProduct,
			}));

			// Act
			await repo.create(mockInsertProduct);

			// Assert
			assert.strictEqual(mockCache.delete.mock.callCount(), 2);
		});

		test("Should return 'DatabaseValidationError' when 'db.create' throws 'ValidationError'", async (t) => {
			// Arrange
			const validationError = new mongoose.Error.ValidationError();

			t.mock.method(Product, "create", () => {
				throw validationError;
			});

			// Act
			const result = await repo.create(mockInsertProduct);

			// Assert
			assert.strictEqual(result.success, false);
			assert.ok(result.error instanceof DatabaseValidationError);
		});

		test("Should return 'DatabaseTimeoutError' when 'db.create' throws 'MongoNetworkTimeoutError'", async (t) => {
			// Arrange
			const timeoutError = new mongoose.mongo.MongoNetworkTimeoutError(
				"Timeout",
			);

			t.mock.method(Product, "create", () => {
				throw timeoutError;
			});

			// Act
			const result = await repo.create(mockInsertProduct);

			// Assert
			assert.strictEqual(result.success, false);
			assert.ok(result.error instanceof DatabaseTimeoutError);
		});

		test("Should return 'DatabaseQueryError' when 'db.create' throws 'MongooseError'", async (t) => {
			// Arrange
			const queryError = new mongoose.Error("Query failed");

			t.mock.method(Product, "create", () => {
				throw queryError;
			});

			// Act
			const result = await repo.create(mockInsertProduct);

			// Assert
			assert.strictEqual(result.success, false);
			assert.ok(result.error instanceof DatabaseQueryError);
		});

		test("Should return 'DatabaseNetworkError' when 'db.create' throws 'MongoError'", async (t) => {
			// Arrange
			const networkError = new mongoose.mongo.MongoError("Network error");

			t.mock.method(Product, "create", () => {
				throw networkError;
			});

			// Act
			const result = await repo.create(mockInsertProduct);

			// Assert
			assert.strictEqual(result.success, false);
			assert.ok(result.error instanceof DatabaseNetworkError);
		});

		test("Should return 'GenericDatabaseError' when 'db.create' throws unknown error", async (t) => {
			// Arrange
			const unknownError = new Error("Something unexpected happened");

			t.mock.method(Product, "create", () => {
				throw unknownError;
			});

			// Act
			const result = await repo.create(mockInsertProduct);

			// Assert
			assert.strictEqual(result.success, false);
			assert.ok(result.error instanceof GenericDatabaseError);
		});
	});

	describe("getAll", () => {
		const cacheKey = "all-1";
		const mockProducts = generateMockSelectProducts({ count: 8 });

		test("Should return array of products when 'db.find' is called once with no args", async (t) => {
			// Arrange
			const mockFind = t.mock.method(Product, "find", () => ({
				select: () => ({
					limit: () => ({
						skip: () => ({
							lean: () => mockProducts,
						}),
					}),
				}),
			}));

			mockCacheMiss({
				instance: mockCache,
			});

			// Act
			const products = await repo.getAll({
				currentPage: 1,
				numberOfProductsPerPage: 10,
				query: {},
			});

			// Assert
			assert.strictEqual(products.success, true);
			assert.ok(Array.isArray(products.data));
			assert.strictEqual(products.data.length, mockProducts.length);
			assert.deepStrictEqual(products.data, mockProducts);

			assert.strictEqual(mockFind.mock.callCount(), 1);
			assert.deepStrictEqual(mockFind.mock.calls[0].arguments[0], {});
		});

		test("Should return array of products when 'cache.get' is called once and returns 'undefined'", async (t) => {
			// Arrange
			mockCacheMiss({
				instance: mockCache,
			});

			t.mock.method(Product, "find", () => ({
				select: () => ({
					limit: () => ({
						skip: () => ({
							lean: () => mockProducts,
						}),
					}),
				}),
			}));

			// Act
			await repo.getAll({
				currentPage: 1,
				numberOfProductsPerPage: 10,
				query: {},
			});

			// Assert
			assert.strictEqual(mockCache.get.mock.callCount(), 1);
			assert.deepStrictEqual(mockCache.get.mock.calls[0].arguments[0], {
				key: cacheKey,
			});
		});

		test("Should return array of products when 'cache.get' is called once and returns value", async () => {
			// Arrange
			mockCacheHit({
				cacheKey,
				instance: mockCache,
				returnValue: mockProducts,
			});

			// Act
			const products = await repo.getAll({
				currentPage: 1,
				numberOfProductsPerPage: 10,
				query: {},
			});

			// Assert
			assert.strictEqual(products.success, true);
			assert.ok(Array.isArray(products.data));
			assert.strictEqual(products.data.length, mockProducts.length);
			assert.deepStrictEqual(products.data, mockProducts);

			assert.strictEqual(mockCache.get.mock.callCount(), 1);
			assert.deepStrictEqual(mockCache.get.mock.calls[0].arguments[0], {
				key: cacheKey,
			});
		});

		test("Should return empty array when 'db.find' returns empty array", async (t) => {
			// Arrange
			mockCacheMiss({ instance: mockCache });

			t.mock.method(Product, "find", () => ({
				select: () => ({
					limit: () => ({
						skip: () => ({
							lean: () => [],
						}),
					}),
				}),
			}));

			// Act
			const products = await repo.getAll({
				currentPage: 1,
				numberOfProductsPerPage: 10,
				query: {},
			});

			// Assert
			assert.ok(products);
			assert.strictEqual(products.success, true);
			assert.ok(Array.isArray(products.data));
			assert.strictEqual(products.data.length, 0);
		});

		test("Should return 'DatabaseValidationError' when 'db.find' throws 'ValidationError'", async (t) => {
			// Arrange
			const validationError = new mongoose.Error.ValidationError();

			t.mock.method(Product, "find", () => {
				throw validationError;
			});

			mockCacheMiss({ instance: mockCache });

			// Act
			const result = await repo.getAll({
				currentPage: 1,
				numberOfProductsPerPage: 10,
				query: {},
			});

			// Assert
			assert.strictEqual(result.success, false);
			assert.ok(result.error instanceof DatabaseValidationError);
		});

		test("Should return 'DatabaseTimeoutError' when 'db.find' throws 'MongoNetworkTimeoutError'", async (t) => {
			// Arrange
			const timeoutError = new mongoose.mongo.MongoNetworkTimeoutError(
				"Timeout",
			);

			t.mock.method(Product, "find", () => {
				throw timeoutError;
			});

			mockCacheMiss({ instance: mockCache });

			// Act
			const result = await repo.getAll({
				currentPage: 1,
				numberOfProductsPerPage: 10,
				query: {},
			});

			// Assert
			assert.strictEqual(result.success, false);
			assert.ok(result.error instanceof DatabaseTimeoutError);
		});

		test("Should return 'DatabaseQueryError' when 'db.find' throws 'MongooseError'", async (t) => {
			// Arrange
			const queryError = new mongoose.Error("Query failed");

			t.mock.method(Product, "find", () => {
				throw queryError;
			});

			mockCacheMiss({ instance: mockCache });

			// Act
			const result = await repo.getAll({
				currentPage: 1,
				numberOfProductsPerPage: 10,
				query: {},
			});

			// Assert
			assert.strictEqual(result.success, false);
			assert.ok(result.error instanceof DatabaseQueryError);
		});

		test("Should return 'DatabaseNetworkError' when 'db.find' throws 'MongoError'", async (t) => {
			// Arrange
			const networkError = new mongoose.mongo.MongoError("Network error");

			t.mock.method(Product, "find", () => {
				throw networkError;
			});

			mockCacheMiss({ instance: mockCache });

			// Act
			const result = await repo.getAll({
				currentPage: 1,
				numberOfProductsPerPage: 10,
				query: {},
			});

			// Assert
			assert.strictEqual(result.success, false);
			assert.ok(result.error instanceof DatabaseNetworkError);
		});

		test("Should return 'GenericDatabaseError' when 'db.find' throws unknown error", async (t) => {
			// Arrange
			const unknownError = new Error("Something unexpected happened");

			t.mock.method(Product, "find", () => {
				throw unknownError;
			});

			mockCacheMiss({ instance: mockCache });

			// Act
			const result = await repo.getAll({
				currentPage: 1,
				numberOfProductsPerPage: 10,
				query: {},
			});

			// Assert
			assert.strictEqual(result.success, false);
			assert.ok(result.error instanceof GenericDatabaseError);
		});
	});

	describe("getById", () => {
		const mockProduct = generateMockSelectProduct();
		const productId = mockProduct._id;
		const cacheKey = productId.toString();

		test("Should return product object when 'db.findById' is called once with 'productId'", async (t) => {
			// Arrange
			mockCacheMiss({
				instance: mockCache,
			});

			const mockFindById = t.mock.method(Product, "findById", () => ({
				lean: () => mockProduct,
			}));

			// Act
			const product = await repo.getById({ productId: mockProduct._id });

			// Assert
			assert.strictEqual(product.success, true);
			assert.ok(product.data);
			assert.deepStrictEqual(product.data, mockProduct);

			assert.strictEqual(mockFindById.mock.callCount(), 1);
			assert.deepStrictEqual(
				mockFindById.mock.calls[0].arguments[0],
				mockProduct._id,
			);
		});

		test("Should return product object when 'cache.get' is called once and returns 'undefined'", async (t) => {
			// Arrange
			mockCacheMiss({
				instance: mockCache,
			});

			t.mock.method(Product, "findById", () => ({
				lean: () => mockProduct,
			}));

			// Act
			await repo.getById({ productId: mockProduct._id });

			// Assert
			assert.strictEqual(mockCache.get.mock.callCount(), 1);
			assert.deepStrictEqual(mockCache.get.mock.calls[0].arguments[0], {
				key: cacheKey,
			});
		});

		test("Should return product object when 'cache.get' is called once and returns value", async () => {
			// Arrange
			mockCacheHit({
				cacheKey,
				instance: mockCache,
				returnValue: mockProduct,
			});

			// Act
			const product = await repo.getById({ productId: mockProduct._id });

			// Assert
			assert.strictEqual(product.success, true);
			assert.ok(product.data);
			assert.deepStrictEqual(product.data, mockProduct);

			assert.strictEqual(mockCache.get.mock.callCount(), 1);
			assert.deepStrictEqual(mockCache.get.mock.calls[0].arguments[0], {
				key: cacheKey,
			});
		});

		test("Should return 'null' when 'db.findById' returns 'null'", async (t) => {
			// Arrange
			mockCacheMiss({ instance: mockCache });

			const mockFindById = t.mock.method(Product, "findById", () => ({
				lean: () => null,
			}));

			// Act
			const product = await repo.getById({ productId: mockProduct._id });

			// Assert
			assert.strictEqual(product.success, true);
			assert.strictEqual(product.data, null);

			assert.strictEqual(mockFindById.mock.callCount(), 1);
			assert.deepStrictEqual(
				mockFindById.mock.calls[0].arguments[0],
				mockProduct._id,
			);
		});

		test("Should return 'DatabaseValidationError' when 'db.findById' throws 'ValidationError'", async (t) => {
			// Arrange
			const validationError = new mongoose.Error.ValidationError();

			t.mock.method(Product, "findById", () => {
				throw validationError;
			});

			mockCacheMiss({ instance: mockCache });

			// Act
			const product = await repo.getById({ productId: mockProduct._id });

			// Assert
			assert.strictEqual(product.success, false);
			assert.ok(product.error instanceof DatabaseValidationError);
		});

		test("Should return 'DatabaseTimeoutError' when 'db.findById' throws 'MongoNetworkTimeoutError'", async (t) => {
			// Arrange
			const timeoutError = new mongoose.mongo.MongoNetworkTimeoutError(
				"Timeout",
			);

			t.mock.method(Product, "findById", () => {
				throw timeoutError;
			});

			mockCacheMiss({ instance: mockCache });

			// Act
			const product = await repo.getById({ productId: mockProduct._id });

			// Assert
			assert.strictEqual(product.success, false);
			assert.ok(product.error instanceof DatabaseTimeoutError);
		});

		test("Should return 'DatabaseQueryError' when 'db.findById' throws 'MongooseError'", async (t) => {
			// Arrange
			const queryError = new mongoose.Error("Query failed");

			t.mock.method(Product, "findById", () => {
				throw queryError;
			});

			mockCacheMiss({ instance: mockCache });

			// Act
			const product = await repo.getById({ productId: mockProduct._id });

			// Assert
			assert.strictEqual(product.success, false);
			assert.ok(product.error instanceof DatabaseQueryError);
		});

		test("Should return 'DatabaseNetworkError' when 'db.findById' throws 'MongoError'", async (t) => {
			// Arrange
			const networkError = new mongoose.mongo.MongoError("Network error");

			t.mock.method(Product, "findById", () => {
				throw networkError;
			});

			mockCacheMiss({ instance: mockCache });

			// Act
			const product = await repo.getById({ productId: mockProduct._id });

			// Assert
			assert.strictEqual(product.success, false);
			assert.ok(product.error instanceof DatabaseNetworkError);
		});

		test("Should return 'GenericDatabaseError' when 'db.findById' throws unknown error", async (t) => {
			// Arrange
			const unknownError = new Error("Something unexpected happened");

			t.mock.method(Product, "findById", () => {
				throw unknownError;
			});

			mockCacheMiss({ instance: mockCache });

			// Act
			const product = await repo.getById({ productId: mockProduct._id });

			// Assert
			assert.strictEqual(product.success, false);
			assert.ok(product.error instanceof GenericDatabaseError);
		});
	});

	describe("getTopRated", () => {
		const mockProducts = generateMockSelectProducts({ count: 3 });
		const cacheKey = "top-rated";
		const limit = 3;

		test("Should return array of products when 'db.find' is called once with no args", async (t) => {
			// Arrange
			mockCacheMiss({
				instance: mockCache,
			});

			const mockFind = t.mock.method(Product, "find", () => ({
				select: () => ({
					sort: () => ({
						limit: () => ({
							lean: () => mockProducts,
						}),
					}),
				}),
			}));

			// Act
			const products = await repo.getTopRated({ limit });

			// Assert
			assert.strictEqual(products.success, true);
			assert.ok(Array.isArray(products.data));
			assert.strictEqual(products.data.length, mockProducts.length);
			assert.deepStrictEqual(products.data, mockProducts);

			assert.strictEqual(mockFind.mock.callCount(), 1);
			assert.deepStrictEqual(mockFind.mock.calls[0].arguments[0], {});
		});

		test("Should return array of products when 'cache.get' is called once and returns 'undefined'", async (t) => {
			// Arrange
			mockCacheMiss({
				instance: mockCache,
			});

			t.mock.method(Product, "find", () => ({
				select: () => ({
					sort: () => ({
						limit: () => ({
							lean: () => mockProducts,
						}),
					}),
				}),
			}));

			// Act
			await repo.getTopRated({ limit });

			// Assert
			assert.strictEqual(mockCache.get.mock.callCount(), 1);
			assert.deepStrictEqual(mockCache.get.mock.calls[0].arguments[0], {
				key: cacheKey,
			});
		});

		test("Should return array of products when 'cache.get' is called once and returns value", async () => {
			// Arrange
			mockCacheHit({
				cacheKey,
				instance: mockCache,
				returnValue: mockProducts,
			});

			// Act
			const products = await repo.getTopRated({ limit });

			// Assert
			assert.strictEqual(products.success, true);
			assert.ok(Array.isArray(products.data));
			assert.strictEqual(products.data.length, mockProducts.length);
			assert.deepStrictEqual(products.data, mockProducts);

			assert.strictEqual(mockCache.get.mock.callCount(), 1);
			assert.deepStrictEqual(mockCache.get.mock.calls[0].arguments[0], {
				key: cacheKey,
			});
		});

		test("Should return empty array when 'db.find' is called once and returns empty array", async (t) => {
			// Arrange
			mockCacheMiss({ instance: mockCache });

			t.mock.method(Product, "find", () => ({
				select: () => ({
					sort: () => ({
						limit: () => ({
							lean: () => [],
						}),
					}),
				}),
			}));

			// Act
			const products = await repo.getTopRated({ limit });

			// Assert
			assert.ok(products);
			assert.strictEqual(products.success, true);
			assert.ok(Array.isArray(products.data));
			assert.strictEqual(products.data.length, 0);
		});

		test("Should return 'DatabaseValidationError' when 'db.find' throws 'ValidationError'", async (t) => {
			// Arrange
			const validationError = new mongoose.Error.ValidationError();

			t.mock.method(Product, "find", () => {
				throw validationError;
			});

			mockCacheMiss({ instance: mockCache });

			// Act
			const products = await repo.getTopRated({ limit });

			// Assert
			assert.strictEqual(products.success, false);
			assert.ok(products.error instanceof DatabaseValidationError);
		});

		test("Should return 'DatabaseTimeoutError' when 'db.find' throws 'MongoNetworkTimeoutError'", async (t) => {
			// Arrange
			const timeoutError = new mongoose.mongo.MongoNetworkTimeoutError(
				"Timeout",
			);

			t.mock.method(Product, "find", () => {
				throw timeoutError;
			});

			mockCacheMiss({ instance: mockCache });

			// Act
			const products = await repo.getTopRated({ limit });

			// Assert
			assert.strictEqual(products.success, false);
			assert.ok(products.error instanceof DatabaseTimeoutError);
		});

		test("Should return 'DatabaseQueryError' when 'db.find' throws 'MongooseError'", async (t) => {
			// Arrange
			const queryError = new mongoose.Error("Query failed");

			t.mock.method(Product, "find", () => {
				throw queryError;
			});

			mockCacheMiss({ instance: mockCache });

			// Act
			const products = await repo.getTopRated({ limit });

			// Assert
			assert.strictEqual(products.success, false);
			assert.ok(products.error instanceof DatabaseQueryError);
		});

		test("Should return 'DatabaseNetworkError' when 'db.find' throws 'MongoError'", async (t) => {
			// Arrange
			const networkError = new mongoose.mongo.MongoError("Network error");

			t.mock.method(Product, "find", () => {
				throw networkError;
			});

			mockCacheMiss({ instance: mockCache });

			// Act
			const products = await repo.getTopRated({ limit });

			// Assert
			assert.strictEqual(products.success, false);
			assert.ok(products.error instanceof DatabaseNetworkError);
		});

		test("Should return 'GenericDatabaseError' when 'db.find' throws unknown error", async (t) => {
			// Arrange
			const unknownError = new Error("Something unexpected happened");

			t.mock.method(Product, "find", () => {
				throw unknownError;
			});

			mockCacheMiss({ instance: mockCache });

			// Act
			const products = await repo.getTopRated({ limit });

			// Assert
			assert.strictEqual(products.success, false);
			assert.ok(products.error instanceof GenericDatabaseError);
		});
	});

	describe("update", () => {
		const mockProduct = generateMockSelectProduct();
		const productId = mockProduct._id;
		const updateData: Partial<InsertProductWithStringImage> = {
			name: "UPDATED PRODUCT NAME",
		};
		const expectedResult = { ...mockProduct, ...updateData };

		const cacheKey = productId.toString();

		test("Should return product object when 'db.findByIdAndUpdate' is called once  with 'productId' and 'data'", async (t) => {
			// Arrange
			mockCacheInvalidation({
				cacheKey,
				instance: mockCache,
			});

			const mockFindByIdAndUpdate = t.mock.method(
				Product,
				"findByIdAndUpdate",
				() => ({
					lean: () => expectedResult,
				}),
			);

			// Act
			const updatedProduct = await repo.update({
				data: updateData,
				productId: mockProduct._id,
			});

			// Assert
			assert.strictEqual(updatedProduct.success, true);
			assert.ok(updatedProduct.data);
			assert.deepStrictEqual(updatedProduct.data, expectedResult);

			assert.strictEqual(mockFindByIdAndUpdate.mock.callCount(), 1);
			assert.deepStrictEqual(
				mockFindByIdAndUpdate.mock.calls[0].arguments[0],
				mockProduct._id,
			);
			assert.deepStrictEqual(
				mockFindByIdAndUpdate.mock.calls[0].arguments[1],
				updateData,
			);
		});

		test("Should call 'cache.delete' and 'cache.stats' once with the correct 'cacheKey'", async (t) => {
			// Arrange
			mockCacheInvalidation({
				cacheKey,
				instance: mockCache,
			});

			t.mock.method(Product, "findByIdAndUpdate", () => ({
				lean: () => expectedResult,
			}));

			// Act
			await repo.update({
				data: updateData,
				productId: mockProduct._id,
			});

			// Assert
			assert.strictEqual(mockCache.delete.mock.callCount(), 1);
			assert.deepStrictEqual(mockCache.delete.mock.calls[0].arguments[0], {
				key: cacheKey,
			});

			assert.strictEqual(mockCache.getStats.mock.callCount(), 1);
			assert.strictEqual(mockCache.getStats.mock.calls[0].arguments.length, 0);
		});

		test("Should return 'null' when 'db.findByIdAndUpdate' returns 'null'", async (t) => {
			// Arrange
			t.mock.method(Product, "findByIdAndUpdate", () => ({
				lean: () => null,
			}));

			// Act
			const updatedProduct = await repo.update({
				data: updateData,
				productId,
			});

			// Assert
			assert.strictEqual(updatedProduct.success, true);
			assert.strictEqual(updatedProduct.data, null);
		});

		test("Should return 'DatabaseValidationError' when 'db.findByIdAndUpdate' throws 'ValidationError'", async (t) => {
			// Arrange
			const validationError = new mongoose.Error.ValidationError();

			t.mock.method(Product, "findByIdAndUpdate", () => {
				throw validationError;
			});

			// Act
			const updatedProduct = await repo.update({
				data: updateData,
				productId,
			});

			// Assert
			assert.strictEqual(updatedProduct.success, false);
			assert.ok(updatedProduct.error instanceof DatabaseValidationError);
		});

		test("Should return 'DatabaseTimeoutError' when 'db.findByIdAndUpdate' throws 'MongoNetworkTimeoutError'", async (t) => {
			// Arrange
			const timeoutError = new mongoose.mongo.MongoNetworkTimeoutError(
				"Timeout",
			);

			t.mock.method(Product, "findByIdAndUpdate", () => {
				throw timeoutError;
			});

			// Act
			const updatedProduct = await repo.update({
				data: updateData,
				productId,
			});

			// Assert
			assert.strictEqual(updatedProduct.success, false);
			assert.ok(updatedProduct.error instanceof DatabaseTimeoutError);
		});

		test("Should return 'DatabaseQueryError' when 'db.findByIdAndUpdate' throws 'MongooseError'", async (t) => {
			// Arrange
			const queryError = new mongoose.Error("Query failed");

			t.mock.method(Product, "findByIdAndUpdate", () => {
				throw queryError;
			});

			// Act
			const updatedProduct = await repo.update({
				data: updateData,
				productId,
			});

			// Assert
			assert.strictEqual(updatedProduct.success, false);
			assert.ok(updatedProduct.error instanceof DatabaseQueryError);
		});

		test("Should return 'DatabaseNetworkError' when 'db.findByIdAndUpdate' throws 'MongoError'", async (t) => {
			// Arrange
			const networkError = new mongoose.mongo.MongoError("Network error");

			t.mock.method(Product, "findByIdAndUpdate", () => {
				throw networkError;
			});

			// Act
			const updatedProduct = await repo.update({
				data: updateData,
				productId,
			});

			// Assert
			assert.strictEqual(updatedProduct.success, false);
			assert.ok(updatedProduct.error instanceof DatabaseNetworkError);
		});

		test("Should return 'GenericDatabaseError' when 'db.findByIdAndUpdate' throws unknown error", async (t) => {
			// Arrange
			const unknownError = new Error("Something unexpected happened");

			t.mock.method(Product, "findByIdAndUpdate", () => {
				throw unknownError;
			});

			// Act
			const updatedProduct = await repo.update({
				data: updateData,
				productId,
			});

			// Assert
			assert.strictEqual(updatedProduct.success, false);
			assert.ok(updatedProduct.error instanceof GenericDatabaseError);
		});
	});

	describe("Delete Product", () => {
		const mockProduct = generateMockSelectProduct();
		const productId = mockProduct._id;

		const cacheKey = productId.toString();

		test("Should return product object when 'db.findByIdAndDelete' is called once", async (t) => {
			// Arrange
			mockCacheInvalidation({
				cacheKey,
				instance: mockCache,
			});

			const mockFindByIdAndDelete = t.mock.method(
				Product,
				"findByIdAndDelete",
				() => ({
					lean: () => mockProduct,
				}),
			);

			// Act
			const deletedProduct = await repo.delete({ productId });

			// Assert
			assert.strictEqual(deletedProduct.success, true);
			assert.ok(deletedProduct.data);
			assert.deepStrictEqual(deletedProduct.data, mockProduct);

			assert.strictEqual(mockFindByIdAndDelete.mock.callCount(), 1);
			assert.deepStrictEqual(
				mockFindByIdAndDelete.mock.calls[0].arguments[0],
				productId,
			);
		});

		test("Should call 'cache.delete' and 'cache.stats' once with the correct 'cacheKey'", async (t) => {
			// Arrange
			mockCacheInvalidation({
				cacheKey,
				instance: mockCache,
			});

			t.mock.method(Product, "findByIdAndDelete", () => ({
				lean: () => mockProduct,
			}));

			// Act
			await repo.delete({ productId });

			// Assert
			assert.strictEqual(mockCache.delete.mock.callCount(), 1);
			assert.deepStrictEqual(mockCache.delete.mock.calls[0].arguments[0], {
				key: cacheKey,
			});

			assert.strictEqual(mockCache.getStats.mock.callCount(), 1);
			assert.strictEqual(mockCache.getStats.mock.calls[0].arguments.length, 0);
		});

		test("Should return 'null' when 'db.findByIdAndDelete' returns 'null'", async (t) => {
			// Arrange
			t.mock.method(Product, "findByIdAndDelete", () => ({
				lean: async () => null,
			}));

			// Act
			const deletedProduct = await repo.delete({ productId });
			// Assert
			assert.strictEqual(deletedProduct.success, true);
			assert.strictEqual(deletedProduct.data, null);
		});

		test("Should return 'DatabaseValidationError' when 'db.findByIdAndDelete' throws 'ValidationError'", async (t) => {
			// Arrange
			const validationError = new mongoose.Error.ValidationError();

			t.mock.method(Product, "findByIdAndDelete", () => {
				throw validationError;
			});

			// Act
			const deletedProduct = await repo.delete({ productId });

			// Assert
			assert.strictEqual(deletedProduct.success, false);
			assert.ok(deletedProduct.error instanceof DatabaseValidationError);
		});

		test("Should return 'DatabaseTimeoutError' when 'db.findByIdAndDelete' throws 'MongoNetworkTimeoutError'", async (t) => {
			// Arrange
			const timeoutError = new mongoose.mongo.MongoNetworkTimeoutError(
				"Timeout",
			);

			t.mock.method(Product, "findByIdAndDelete", () => {
				throw timeoutError;
			});

			// Act
			const deletedProduct = await repo.delete({ productId });

			// Assert
			assert.strictEqual(deletedProduct.success, false);
			assert.ok(deletedProduct.error instanceof DatabaseTimeoutError);
		});

		test("Should return 'DatabaseQueryError' when 'db.findByIdAndDelete' throws 'MongooseError'", async (t) => {
			// Arrange
			const queryError = new mongoose.Error("Query failed");

			t.mock.method(Product, "findByIdAndDelete", () => {
				throw queryError;
			});

			// Act
			const deletedProduct = await repo.delete({ productId });

			// Assert
			assert.strictEqual(deletedProduct.success, false);
			assert.ok(deletedProduct.error instanceof DatabaseQueryError);
		});

		test("Should return 'DatabaseNetworkError' when 'db.findByIdAndDelete' throws 'MongoError'", async (t) => {
			// Arrange
			const networkError = new mongoose.mongo.MongoError("Network error");

			t.mock.method(Product, "findByIdAndDelete", () => {
				throw networkError;
			});

			// Act
			const deletedProduct = await repo.delete({ productId });

			// Assert
			assert.strictEqual(deletedProduct.success, false);
			assert.ok(deletedProduct.error instanceof DatabaseNetworkError);
		});

		test("Should return 'GenericDatabaseError' when 'db.findByIdAndDelete' throws unknown error", async (t) => {
			// Arrange
			const unknownError = new Error("Something unexpected happened");

			t.mock.method(Product, "findByIdAndDelete", () => {
				throw unknownError;
			});

			// Act
			const deletedProduct = await repo.delete({ productId });

			// Assert
			assert.strictEqual(deletedProduct.success, false);
			assert.ok(deletedProduct.error instanceof GenericDatabaseError);
		});
	});

	describe("count", () => {
		test("Should return the count as a number when 'db.countDocuments' is called once with no args", async (t) => {
			// Arrange
			const mockCount = 10;

			const mockCountDocuments = t.mock.method(
				Product,
				"countDocuments",
				() => ({
					lean: () => mockCount,
				}),
			);

			// Act
			const count = await repo.count({});

			// Assert
			assert.strictEqual(count.success, true);
			assert.ok(typeof count.data === "number");
			assert.strictEqual(count.data, mockCount);

			assert.strictEqual(mockCountDocuments.mock.callCount(), 1);
			assert.deepStrictEqual(mockCountDocuments.mock.calls[0].arguments[0], {});
		});

		test("Should return '0' when 'db.countDocuments' returns '0'", async (t) => {
			// Arrange
			const mockCount = 0;

			t.mock.method(Product, "countDocuments", () => ({
				lean: () => mockCount,
			}));

			// Act
			const count = await repo.count({});

			// Assert
			assert.strictEqual(count.success, true);
			assert.strictEqual(count.data, mockCount);
		});

		test("Should return 'DatabaseValidationError' when 'db.countDocuments' throws 'ValidationError'", async (t) => {
			// Arrange
			const validationError = new mongoose.Error.ValidationError();

			t.mock.method(Product, "countDocuments", () => {
				throw validationError;
			});

			// Act
			const count = await repo.count({});

			// Assert
			assert.strictEqual(count.success, false);
			assert.ok(count.error instanceof DatabaseValidationError);
		});

		test("Should return 'DatabaseTimeoutError' when 'db.countDocuments' throws 'MongoNetworkTimeoutError'", async (t) => {
			// Arrange
			const timeoutError = new mongoose.mongo.MongoNetworkTimeoutError(
				"Timeout",
			);

			t.mock.method(Product, "countDocuments", () => {
				throw timeoutError;
			});

			// Act
			const result = await repo.count({});

			// Assert
			assert.strictEqual(result.success, false);
			assert.ok(result.error instanceof DatabaseTimeoutError);
		});

		test("Should return 'DatabaseQueryError' when 'db.countDocuments' throws 'MongooseError'", async (t) => {
			// Arrange
			const queryError = new mongoose.Error("Query failed");

			t.mock.method(Product, "countDocuments", () => {
				throw queryError;
			});

			// Act
			const result = await repo.count({});

			// Assert
			assert.strictEqual(result.success, false);
			assert.ok(result.error instanceof DatabaseQueryError);
		});

		test("Should return 'DatabaseNetworkError' when 'db.countDocuments' throws 'MongoError'", async (t) => {
			// Arrange
			const networkError = new mongoose.mongo.MongoError("Network error");

			t.mock.method(Product, "countDocuments", () => {
				throw networkError;
			});

			// Act
			const result = await repo.count({});

			// Assert
			assert.strictEqual(result.success, false);
			assert.ok(result.error instanceof DatabaseNetworkError);
		});

		test("Should return 'GenericDatabaseError' when 'db.countDocuments' throws unknown error", async (t) => {
			// Arrange
			const unknownError = new Error("Something unexpected happened");

			t.mock.method(Product, "countDocuments", () => {
				throw unknownError;
			});

			// Act
			const result = await repo.count({});

			// Assert
			assert.strictEqual(result.success, false);
			assert.ok(result.error instanceof GenericDatabaseError);
		});
	});
});
