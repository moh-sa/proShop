import assert from "node:assert";
import test, { after, before, beforeEach, describe, suite } from "node:test";

import { DatabaseValidationError } from "../../errors/index.js";
import { ProductModel } from "../../models/product.model.js";
import { ProductRepository } from "../../repositories/index.js";
import { CacheService } from "../../services/index.js";
import type { Product, TopRatedProduct } from "../../types/index.js";
import { generateMockObjectId } from "../mocks/index.js";
import {
	generateMockInsertProductsWithStringImage,
	generateMockInsertProductWithStringImage,
} from "../mocks/product.mock.js";
import {
	connectTestDatabase,
	createProduct,
	createProducts,
	disconnectTestDatabase,
} from "../utils/index.js";

suite("Product Repository 〖 Integration Tests 〗", async () => {
	const cacheService = new CacheService("product");
	const productRepository = new ProductRepository(ProductModel, cacheService);

	before(async () => await connectTestDatabase());
	after(async () => await disconnectTestDatabase());

	beforeEach(async () => {
		await ProductModel.deleteMany({});
		cacheService.flush();
	});

	describe("create", () => {
		test("should create a product when 'db.create' is called with valid product data", async () => {
			// Arrange
			const mockProduct = generateMockInsertProductWithStringImage();

			// Act
			const result = await productRepository.create(mockProduct);

			// Assert
			assert.strictEqual(result.success, true);

			assert.ok(result.data.id);
			assert.equal(result.data.name, mockProduct.name);
			assert.equal(result.data.brand, mockProduct.brand);
			assert.equal(result.data.category, mockProduct.category);
			assert.equal(result.data.description, mockProduct.description);
			assert.equal(result.data.price, mockProduct.price);
			assert.equal(result.data.countInStock, mockProduct.countInStock);
			assert.equal(result.data.image, mockProduct.image);
			assert.equal(result.data.rating, 0);
			assert.equal(result.data.numReviews, 0);
		});

		test("should cache the created product when 'db.create' is called with valid data", async () => {
			// Arrange
			const mockProduct = generateMockInsertProductWithStringImage();

			// Act
			const createdProduct = await productRepository.create(mockProduct);
			assert.strictEqual(createdProduct.success, true);

			const cachedProduct = cacheService.get<Product>({
				key: createdProduct.data.id,
			});

			// Assert
			assert.ok(cachedProduct.success);
			assert.ok(cachedProduct.data);
			// IDs does not have the same reference
			const { id: createdProductId, ...assertProduct } = createdProduct.data;
			const { id: cachedProductId, ...assertCached } = cachedProduct.data;
			assert.deepStrictEqual(createdProductId, cachedProductId);
			assert.deepStrictEqual(assertProduct, assertCached);
		});

		test("should return 'DatabaseValidationError' when 'db.create' is called with invalid data", async () => {
			// Arrange
			const invalidProduct = {
				...generateMockInsertProductWithStringImage(),
				price: "invalid-price" as unknown as number,
			};

			// Act
			const result = await productRepository.create(invalidProduct);

			// Assert
			assert.strictEqual(result.success, false);
			assert.ok(result.error instanceof DatabaseValidationError);
		});
	});

	describe("getAll", () => {
		test("should return paginated response with items and meta when 'getAll' is called with valid parameters", async () => {
			// Arrange
			const createdProducts = await createProducts(
				generateMockInsertProductsWithStringImage({ count: 3 }),
			);

			// Act
			const result = await productRepository.getAll({
				pageNumber: 1,
				pageSize: 10,
			});

			// Assert
			assert.strictEqual(result.success, true);
			assert.ok(result.data);
			assert.ok(Array.isArray(result.data.items));
			assert.strictEqual(result.data.items.length, createdProducts.length);

			assert.ok(result.data.meta);
		});

		test("should return correct pagination meta when 'getAll' is called", async () => {
			// Arrange
			await createProducts(
				generateMockInsertProductsWithStringImage({ count: 3 }),
			);

			// Act
			const result = await productRepository.getAll({
				pageNumber: 1,
				pageSize: 10,
			});

			// Assert
			assert.strictEqual(result.success, true);
			assert.strictEqual(result.data.meta.currentPage, 1);
			assert.strictEqual(result.data.meta.pageSize, 10);
			assert.strictEqual(result.data.meta.totalItems, 3);
			assert.strictEqual(result.data.meta.totalPages, 1);
			assert.strictEqual(result.data.meta.hasNextPage, false);
			assert.strictEqual(result.data.meta.hasPreviousPage, false);
		});

		test("should return correct number of items per page when 'getAll' is called with specific pageSize", async () => {
			// Arrange
			await createProducts(
				generateMockInsertProductsWithStringImage({ count: 5 }),
			);

			const pageSize = 2;

			// Act
			const result = await productRepository.getAll({
				pageNumber: 1,
				pageSize,
			});

			// Assert
			assert.strictEqual(result.success, true);
			assert.strictEqual(result.data.items.length, pageSize);
			assert.strictEqual(result.data.meta.pageSize, pageSize);
		});

		test("should return correct page of items when 'getAll' is called with specific pageNumber", async () => {
			// Arrange
			await createProducts(
				generateMockInsertProductsWithStringImage({ count: 5 }),
			);

			const pageSize = 2;
			const pageNumber = 2;

			// Act
			const result = await productRepository.getAll({
				pageNumber,
				pageSize,
			});

			// Assert
			assert.strictEqual(result.success, true);
			assert.strictEqual(result.data.items.length, pageSize);
			assert.strictEqual(result.data.meta.currentPage, pageNumber);
		});

		test("should return correct pagination meta for multiple pages when 'getAll' is called", async () => {
			// Arrange
			await createProducts(
				generateMockInsertProductsWithStringImage({ count: 5 }),
			);

			const pageSize = 2;
			const pageNumber = 2;

			// Act
			const result = await productRepository.getAll({
				pageNumber,
				pageSize,
			});

			// Assert
			assert.strictEqual(result.success, true);
			assert.strictEqual(result.data.meta.currentPage, pageNumber);
			assert.strictEqual(result.data.meta.pageSize, pageSize);
			assert.strictEqual(result.data.meta.totalItems, 5);
			assert.strictEqual(result.data.meta.totalPages, 3);
			assert.strictEqual(result.data.meta.hasNextPage, true);
			assert.strictEqual(result.data.meta.hasPreviousPage, true);
		});

		test("should return filtered items when 'getAll' is called with filters", async () => {
			// Arrange
			const createdProducts = await createProducts(
				generateMockInsertProductsWithStringImage({ count: 3 }),
			);

			const targetBrand = createdProducts[0].brand;

			// Act
			const result = await productRepository.getAll({
				pageNumber: 1,
				pageSize: 10,
				filters: { brand: targetBrand },
			});

			// Assert
			assert.strictEqual(result.success, true);
			assert.ok(result.data);
			assert.ok(Array.isArray(result.data.items));
			assert.ok(result.data.items.length > 0);
			result.data.items.forEach((product) => {
				assert.equal(product.brand, targetBrand);
			});
		});

		test("should return empty items array when 'getAll' is called and no products match criteria", async () => {
			// Arrange
			await createProducts(
				generateMockInsertProductsWithStringImage({ count: 5 }),
			);

			// Act
			const result = await productRepository.getAll({
				pageNumber: 1,
				pageSize: 10,
				filters: { brand: "Non-existent Brand" },
			});

			// Assert
			assert.strictEqual(result.success, true);
			assert.ok(result.data);
			assert.ok(Array.isArray(result.data.items));
			assert.strictEqual(result.data.items.length, 0);
			assert.strictEqual(result.data.meta.totalItems, 0);
		});

		test("should return correct pagination meta when no products match criteria", async () => {
			// Arrange
			await createProducts(
				generateMockInsertProductsWithStringImage({ count: 3 }),
			);

			// Act
			const result = await productRepository.getAll({
				pageNumber: 1,
				pageSize: 10,
				filters: { brand: "Non-existent Brand" },
			});

			// Assert
			assert.strictEqual(result.success, true);
			assert.strictEqual(result.data.meta.currentPage, 1);
			assert.strictEqual(result.data.meta.pageSize, 10);
			assert.strictEqual(result.data.meta.totalItems, 0);
			assert.strictEqual(result.data.meta.totalPages, 1);
			assert.strictEqual(result.data.meta.hasNextPage, false);
			assert.strictEqual(result.data.meta.hasPreviousPage, false);
		});

		test("should return sorted items when 'getAll' is called with sort parameter", async () => {
			// Arrange
			const createdProducts = await createProducts(
				generateMockInsertProductsWithStringImage({ count: 3 }),
			);

			const expectedResult = createdProducts.sort((a, b) => a.price - b.price);

			// Act
			const result = await productRepository.getAll({
				pageNumber: 1,
				pageSize: 10,
				sort: { price: "asc" },
			});

			// Assert
			assert.strictEqual(result.success, true);
			assert.ok(Array.isArray(result.data.items));
			assert.strictEqual(result.data.items.length, 3);
			result.data.items.map((item, index) => {
				const expectedItem = expectedResult[index];
				assert.strictEqual(item.price, expectedItem.price);
			});
		});

		test("should return filtered items when 'getAll' is called with category filter", async () => {
			// Arrange
			const createdProducts = await createProducts(
				generateMockInsertProductsWithStringImage({ count: 5 }),
			);

			const targetCategory = createdProducts[0].category;

			// Act
			const result = await productRepository.getAll({
				pageNumber: 1,
				pageSize: 10,
				filters: { category: targetCategory },
			});

			// Assert
			assert.strictEqual(result.success, true);
			assert.ok(result.data);
			assert.ok(Array.isArray(result.data.items));
			assert.ok(result.data.items.length > 0);

			result.data.items.forEach((product) => {
				assert.equal(product.category, targetCategory);
			});
		});

		test("should return items matching keyword text search when 'getAll' is called with filters.keyword", async () => {
			// Arrange
			const createdProducts = await createProducts(
				generateMockInsertProductsWithStringImage({ count: 4 }),
			);

			const targetProduct = createdProducts[0];
			const keyword = targetProduct.name;

			// Act
			const result = await productRepository.getAll({
				pageNumber: 1,
				pageSize: 10,
				filters: { keyword },
			});

			// Assert
			assert.strictEqual(result.success, true);
			assert.ok(result.data);
			assert.ok(result.data.items.length >= 1);
			const matched = result.data.items.some(
				(product) => product.id === targetProduct.id,
			);
			assert.ok(matched);
		});

		test("should return only selected fields when 'getAll' is called with select", async () => {
			// Arrange
			await createProducts(
				generateMockInsertProductsWithStringImage({ count: 3 }),
			);

			// Act
			const result = await productRepository.getAll({
				pageNumber: 1,
				pageSize: 10,
				select: { name: true, price: true },
			});

			// Assert
			assert.strictEqual(result.success, true);
			assert.strictEqual(result.data.items.length, 3);
			result.data.items.forEach((item) => {
				assert.ok("name" in item && item.name !== undefined);
				assert.ok("price" in item && typeof item.price === "number");
				assert.ok(!("description" in item));
			});
		});
	});

	describe("getTopRated", () => {
		test("should return cached products when 'db.getTopRated' is called and cache exists", async () => {
			// Arrange
			const createdProducts = await createProducts(
				generateMockInsertProductsWithStringImage({ count: 3 }),
			);

			// Act
			const products = await productRepository.getTopRated({ limit: 3 });

			// Assert
			assert.strictEqual(products.success, true);
			assert.ok(Array.isArray(products.data));
			assert.strictEqual(products.data.length, createdProducts.length);

			const createdProductsIds = createdProducts.map((product) => product.id);
			products.data.forEach((product) => {
				assert.ok(createdProductsIds.includes(product.id));
			});
		});

		test("should return and cache products when 'db.getTopRated' is called and cache doesn't exist", async () => {
			// Arrange
			const createdProducts = await createProducts(
				generateMockInsertProductsWithStringImage({ count: 3 }),
			);

			// Act & Assert
			const noProductsCached = cacheService.get({ key: "top-rated" });
			assert.strictEqual(noProductsCached.success, true);
			assert.strictEqual(noProductsCached.data, undefined);

			const products = await productRepository.getTopRated({ limit: 3 });
			assert.strictEqual(products.success, true);
			assert.ok(Array.isArray(products.data));
			assert.strictEqual(products.data.length, createdProducts.length);

			const cachedProducts = cacheService.get<Array<TopRatedProduct>>({
				key: "top-rated",
			});
			assert.ok(cachedProducts.success);
			assert.ok(cachedProducts.data);
			assert.strictEqual(cachedProducts.data.length, createdProducts.length);
		});

		test("should return correct number of products when 'db.getTopRated' is called with limit", async () => {
			// Arrange
			await createProducts(
				generateMockInsertProductsWithStringImage({ count: 5 }),
			);

			const limit = 2;

			// Act
			const products = await productRepository.getTopRated({ limit });

			// Assert
			assert.strictEqual(products.success, true);
			assert.ok(Array.isArray(products.data));
			assert.strictEqual(products.data.length, limit);
		});

		test("should return products sorted by rating when 'db.getTopRated' is called", async () => {
			// Arrange
			const createdProducts = await createProducts(
				generateMockInsertProductsWithStringImage({ count: 3 }),
			);

			const expectedResult = createdProducts.sort(
				(a, b) => b.rating - a.rating,
			);

			// Act
			const products = await productRepository.getTopRated({ limit: 3 });

			// Assert
			assert.strictEqual(products.success, true);
			assert.ok(Array.isArray(products.data));
			assert.strictEqual(products.data.length, createdProducts.length);

			products.data.forEach((product, index) => {
				assert.strictEqual(product.id, expectedResult[index].id);
			});
		});

		test("should return empty array when 'db.getTopRated' is called and no products exist", async () => {
			// Act
			const products = await productRepository.getTopRated({ limit: 3 });

			// Assert
			assert.strictEqual(products.success, true);
			assert.ok(Array.isArray(products.data));
			assert.strictEqual(products.data.length, 0);
		});
	});

	describe("getById", () => {
		test("should return cached product when 'db.findById' is called with an ID that exists in cache", async () => {
			// Arrange
			const createdProduct = await createProduct(
				generateMockInsertProductWithStringImage(),
			);

			// Act
			const product = await productRepository.getById({
				productId: createdProduct.id,
			});

			// Assert
			assert.strictEqual(product.success, true);
			assert.ok(product.data);
			assert.strictEqual(product.data.name, createdProduct.name);
			assert.strictEqual(product.data.brand, createdProduct.brand);
			assert.strictEqual(product.data.category, createdProduct.category);
			assert.strictEqual(product.data.description, createdProduct.description);
			assert.strictEqual(product.data.price, createdProduct.price);
			assert.strictEqual(
				product.data.countInStock,
				createdProduct.countInStock,
			);
			assert.strictEqual(product.data.image, createdProduct.image);
			assert.strictEqual(product.data.rating, createdProduct.rating);
			assert.strictEqual(product.data.numReviews, createdProduct.numReviews);
		});

		test("should return product and cache it when 'db.findById' is called with valid ID not in cache", async () => {
			// Arrange
			const createdProduct = await createProduct(
				generateMockInsertProductWithStringImage(),
			);

			const productId = createdProduct.id;

			// Act & Assert
			const noProductCached = cacheService.get({
				key: productId,
			});
			assert.strictEqual(noProductCached.success, true);
			assert.strictEqual(noProductCached.data, undefined);

			await productRepository.getById({
				productId,
			});

			const cachedProduct = cacheService.get<Product>({
				key: productId,
			});
			assert.ok(cachedProduct.success);
			assert.ok(cachedProduct.data);
			assert.strictEqual(cachedProduct.data.name, createdProduct.name);
		});

		test("should return null when 'db.findById' is called with non-existent ID", async () => {
			// Arrange
			const nonExistentId = generateMockObjectId();

			// Act
			const product = await productRepository.getById({
				productId: nonExistentId,
			});

			// Assert
			assert.strictEqual(product.success, true);
			assert.strictEqual(product.data, null);
		});

		test("should throw 'DatabaseValidationError' when 'db.findById' is called with invalid ObjectId", async () => {
			// Arrange
			const invalidId = "invalid-id";

			// Act
			const result = await productRepository.getById({ productId: invalidId });

			// Assert
			assert.strictEqual(result.success, false);
			assert.ok(result.error instanceof DatabaseValidationError);
		});
	});

	describe("update", () => {
		test("should update and return product when 'db.update' is called with valid ID and data", async () => {
			// Arrange
			const createdProduct = await createProduct(
				generateMockInsertProductWithStringImage(),
			);

			const updateData = {
				name: "Updated Product Name",
				price: 999,
			};

			// Act
			const updatedProduct = await productRepository.update({
				data: updateData,
				productId: createdProduct.id,
			});

			// Assert
			assert.strictEqual(updatedProduct.success, true);
			assert.ok(updatedProduct.data);
			assert.equal(updatedProduct.data.name, updateData.name);
			assert.equal(updatedProduct.data.price, updateData.price);

			// Verify other fields remain unchanged
			assert.equal(updatedProduct.data.brand, createdProduct.brand);
			assert.equal(updatedProduct.data.category, createdProduct.category);
		});

		test("should update the cached product when 'db.update' is called", async () => {
			// Arrange
			const createdProduct = await createProduct(
				generateMockInsertProductWithStringImage(),
			);

			const productId = createdProduct.id;

			const updateData = { name: "Updated Product Name" };

			// Act
			await productRepository.update({
				data: updateData,
				productId,
			});
			const cachedProduct = cacheService.get<Product>({
				key: productId,
			});

			// Assert
			assert.strictEqual(cachedProduct.success, true);
			assert.ok(cachedProduct.data);
			assert.strictEqual(cachedProduct.data.name, updateData.name);
		});

		test("should return null when 'db.update' is called with non-existent ID", async () => {
			// Arrange
			const nonExistentId = generateMockObjectId();
			const updateData = { name: "Updated Product Name" };

			// Act
			const updatedProduct = await productRepository.update({
				data: updateData,
				productId: nonExistentId,
			});

			// Assert
			assert.strictEqual(updatedProduct.success, true);
			assert.strictEqual(updatedProduct.data, null);
		});

		test("should return DatabaseValidationError when 'db.update' is called with invalid data", async () => {
			// Arrange
			const createdProduct = await createProduct(
				generateMockInsertProductWithStringImage(),
			);

			const invalidData = { price: "invalid-price" as unknown as number };

			// Act
			const result = await productRepository.update({
				data: invalidData,
				productId: createdProduct.id,
			});

			// Assert
			assert.strictEqual(result.success, false);
			assert.ok(result.error instanceof DatabaseValidationError);
		});

		test("should return DatabaseValidationError when 'update' is called with invalid ObjectId", async () => {
			// Arrange
			const invalidId = "invalid-id";
			const updateData = { name: "Updated Product Name" };

			// Act
			const result = await productRepository.update({
				data: updateData,
				productId: invalidId,
			});

			// Assert
			assert.strictEqual(result.success, false);
			assert.ok(result.error instanceof DatabaseValidationError);
		});
	});

	describe("delete", () => {
		test("should delete and return product when 'db.delete' is called with valid ID", async () => {
			// Arrange
			const createdProduct = await createProduct(
				generateMockInsertProductWithStringImage(),
			);

			const productId = createdProduct.id;

			// Act
			const deletedProduct = await productRepository.delete({
				productId,
			});

			// Assert
			assert.strictEqual(deletedProduct.success, true);
			assert.ok(deletedProduct.data);
			assert.equal(deletedProduct.data.name, createdProduct.name);
			assert.equal(deletedProduct.data.description, createdProduct.description);
			assert.equal(deletedProduct.data.brand, createdProduct.brand);
			assert.equal(deletedProduct.data.category, createdProduct.category);
			assert.equal(deletedProduct.data.price, createdProduct.price);
			assert.equal(
				deletedProduct.data.countInStock,
				createdProduct.countInStock,
			);
			assert.equal(deletedProduct.data.image, createdProduct.image);
			assert.equal(deletedProduct.data.rating, createdProduct.rating);
			assert.equal(deletedProduct.data.numReviews, createdProduct.numReviews);

			// Verify product is actually deleted
			const isProductExists = await productRepository.getById({
				productId,
			});
			assert.strictEqual(isProductExists.success, true);
			assert.strictEqual(isProductExists.data, null);
		});

		test("should invalidate product cache when 'db.delete' is called successfully", async () => {
			// Arrange
			const created = await productRepository.create(
				generateMockInsertProductWithStringImage(),
			);
			assert.ok(created.success);
			const productId = created.data.id;

			// Act
			await productRepository.delete({ productId });

			// Assert
			const cachedProduct = cacheService.get<Product>({
				key: productId,
			});
			assert.strictEqual(cachedProduct.success, true);
			assert.strictEqual(cachedProduct.data, undefined);
		});

		test(
			"should invalidate top-rated cache when 'db.delete' is called successfully",
			{ todo: true },
		);

		test("should return null when 'db.delete' is called with non-existent ID", async () => {
			// Arrange
			const nonExistentId = generateMockObjectId();

			// Act
			const deletedProduct = await productRepository.delete({
				productId: nonExistentId,
			});

			// Assert
			assert.strictEqual(deletedProduct.success, true);
			assert.strictEqual(deletedProduct.data, null);
		});

		test("should throw DatabaseValidationError when 'delete' is called with invalid ObjectId", async () => {
			// Arrange
			const invalidId = "invalid-id";

			// Act
			const result = await productRepository.delete({ productId: invalidId });

			// Assert
			assert.strictEqual(result.success, false);
			assert.ok(result.error instanceof DatabaseValidationError);
		});

		describe("count", () => {
			test("should return total count when 'db.count' is called without query", async () => {
				// Arrange
				const createdProducts = await createProducts(
					generateMockInsertProductsWithStringImage({ count: 3 }),
				);

				// Act
				const count = await productRepository.count({});

				// Assert
				assert.strictEqual(count.success, true);
				assert.strictEqual(count.data, createdProducts.length);
			});

			test("should return filtered count when 'db.count' is called with query filters", async () => {
				// Arrange
				const createdProducts = await createProducts(
					generateMockInsertProductsWithStringImage({ count: 5 }),
				);

				const targetBrand = createdProducts[0].brand;
				const productsWithTargetBrand = createdProducts.filter(
					(p) => p.brand === targetBrand,
				);

				// Act
				const count = await productRepository.count({ brand: targetBrand });

				// Assert
				assert.strictEqual(count.success, true);
				assert.strictEqual(count.data, productsWithTargetBrand.length);
			});

			test("should return 0 when 'db.count' is called and no products match criteria", async () => {
				// Arrange
				await createProducts(
					generateMockInsertProductsWithStringImage({ count: 3 }),
				);

				// Act
				const count = await productRepository.count({
					brand: "Non-existent Brand",
				});

				// Assert
				assert.strictEqual(count.success, true);
				assert.strictEqual(count.data, 0);
			});
		});
	});
});
