import { Types } from "mongoose";
import assert from "node:assert";
import test, { after, before, beforeEach, describe, suite } from "node:test";

import type { SelectProduct, TopRatedProduct } from "../../types/index.js";

import { DatabaseValidationError } from "../../errors/index.js";
import { ProductModel } from "../../models/product.model.js";
import { ProductRepository } from "../../repositories/index.js";
import { CacheService } from "../../services/index.js";
import { generateMockObjectId } from "../mocks/index.js";
import {
	generateMockInsertProductWithStringImage,
	generateMockSelectProduct,
	generateMockSelectProducts,
} from "../mocks/product.mock.js";
import {
	connectTestDatabase,
	disconnectTestDatabase,
} from "../utils/database-connection.utils.js";

suite("Product Repository 〖 Integration Tests 〗", async () => {
	let productRepository: ProductRepository;
	let cacheService: CacheService;

	before(async () => {
		await connectTestDatabase();
		cacheService = new CacheService("product");
		productRepository = new ProductRepository(ProductModel, cacheService);
	});

	after(async () => {
		await disconnectTestDatabase();
	});

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

			assert.ok(result.data._id);
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

			const cachedProduct = cacheService.get<SelectProduct>({
				key: createdProduct.data._id.toString(),
			});

			// Assert
			assert.ok(cachedProduct.success);
			assert.ok(cachedProduct.data);
			// IDs does not have the same reference
			const { _id: createdProductId, ...assertProduct } = createdProduct.data;
			const { _id: cachedProductId, ...assertCached } = cachedProduct.data;
			assert.deepStrictEqual(
				createdProductId.toString(),
				cachedProductId.toString(),
			);
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
			const mockProducts = generateMockSelectProducts({ count: 3 });
			await Promise.all(
				mockProducts.map(
					async (product) => await productRepository.create(product),
				),
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
			assert.strictEqual(result.data.items.length, mockProducts.length);

			assert.ok(result.data.meta);
		});

		test("should return correct pagination meta when 'getAll' is called", async () => {
			// Arrange
			const mockProducts = generateMockSelectProducts({ count: 3 });
			await ProductModel.insertMany(mockProducts);

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
			const mockProducts = generateMockSelectProducts({ count: 5 });
			await ProductModel.insertMany(mockProducts);
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
			const mockProducts = generateMockSelectProducts({ count: 5 });
			await ProductModel.insertMany(mockProducts);
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
			const mockProducts = generateMockSelectProducts({ count: 5 });
			await ProductModel.insertMany(mockProducts);
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
			const mockProducts = generateMockSelectProducts({ count: 5 });
			const targetBrand = mockProducts[0].brand;
			await ProductModel.insertMany(mockProducts);

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
			const mockProducts = generateMockSelectProducts({ count: 3 });
			await ProductModel.insertMany(mockProducts);

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
			const mockProducts = generateMockSelectProducts({ count: 3 });
			await ProductModel.insertMany(mockProducts);

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
			const mockProducts = generateMockSelectProducts({ count: 3 });
			const expectedResult = mockProducts.sort((a, b) => a.price - b.price);
			await ProductModel.insertMany(mockProducts);

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
			const mockProducts = generateMockSelectProducts({ count: 5 });
			const targetCategory = mockProducts[0].category;
			await ProductModel.insertMany(mockProducts);

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
			const mockProducts = generateMockSelectProducts({ count: 4 });
			const targetProduct = mockProducts[0];
			const keyword = targetProduct.name;
			await ProductModel.insertMany(mockProducts);

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
			const matched = result.data.items.some((product) =>
				product._id.equals(targetProduct._id),
			);
			assert.ok(matched);
		});

		test("should return only selected fields when 'getAll' is called with select", async () => {
			// Arrange
			const mockProducts = generateMockSelectProducts({ count: 3 });
			await ProductModel.insertMany(mockProducts);

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
			const mockProducts = generateMockSelectProducts({ count: 3 });
			await Promise.all(
				mockProducts.map(
					async (product) => await productRepository.create(product),
				),
			);

			// Act
			const products = await productRepository.getTopRated({ limit: 3 });

			// Assert
			assert.strictEqual(products.success, true);
			assert.ok(Array.isArray(products.data));
			assert.strictEqual(products.data.length, mockProducts.length);
			const mockProductsIds = mockProducts.map((product) =>
				product._id.toString(),
			);
			products.data.forEach((product) => {
				assert.ok(mockProductsIds.includes(product._id.toString()));
			});
		});

		test("should return and cache products when 'db.getTopRated' is called and cache doesn't exist", async () => {
			// Arrange
			const mockProducts = generateMockSelectProducts({ count: 3 });
			await ProductModel.insertMany(mockProducts);

			// Act & Assert
			const noProductsCached = cacheService.get({ key: "top-rated" });
			assert.strictEqual(noProductsCached.success, true);
			assert.strictEqual(noProductsCached.data, undefined);

			const products = await productRepository.getTopRated({ limit: 3 });
			assert.strictEqual(products.success, true);
			assert.ok(Array.isArray(products.data));
			assert.strictEqual(products.data.length, mockProducts.length);

			const cachedProducts = cacheService.get<Array<TopRatedProduct>>({
				key: "top-rated",
			});
			assert.ok(cachedProducts.success);
			assert.ok(cachedProducts.data);
			assert.strictEqual(cachedProducts.data.length, mockProducts.length);
		});

		test("should return correct number of products when 'db.getTopRated' is called with limit", async () => {
			// Arrange
			const mockProducts = generateMockSelectProducts({ count: 5 });
			await ProductModel.insertMany(mockProducts);
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
			const numberOfProducts = 3;
			const mockProducts = generateMockSelectProducts({
				count: numberOfProducts,
			}).map((product, index) => ({
				...product,
				rating: 5 - index, // Create descending ratings: 5, 4, 3
			}));
			await ProductModel.insertMany(mockProducts);

			// Act
			const products = await productRepository.getTopRated({ limit: 3 });

			// Assert
			assert.strictEqual(products.success, true);
			assert.ok(Array.isArray(products.data));
			assert.strictEqual(products.data.length, numberOfProducts);

			for (let i = 1; i < products.data.length; i++) {
				const prevProduct = await ProductModel.findById(
					products.data[i - 1]._id,
				).lean();
				const currentProduct = await ProductModel.findById(
					products.data[i]._id,
				).lean();
				assert.ok(
					prevProduct!.rating >= currentProduct!.rating,
					"Products should be sorted by rating in descending order",
				);
			}
		});

		test("should return empty array when 'db.getTopRated' is called and no products exist", async () => {
			// Arrange - no products in database

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
			const mockProduct = generateMockSelectProduct();
			await productRepository.create(mockProduct);

			// Act
			const product = await productRepository.getById({
				productId: mockProduct._id,
			});

			// Assert
			assert.strictEqual(product.success, true);
			assert.ok(product.data);
			assert.strictEqual(product.data.name, mockProduct.name);
			assert.strictEqual(product.data.brand, mockProduct.brand);
			assert.strictEqual(product.data.category, mockProduct.category);
			assert.strictEqual(product.data.description, mockProduct.description);
			assert.strictEqual(product.data.price, mockProduct.price);
			assert.strictEqual(product.data.countInStock, mockProduct.countInStock);
			assert.strictEqual(product.data.image, mockProduct.image);
			assert.strictEqual(product.data.rating, mockProduct.rating);
			assert.strictEqual(product.data.numReviews, mockProduct.numReviews);
		});

		test("should return product and cache it when 'db.findById' is called with valid ID not in cache", async () => {
			// Arrange
			const mockProduct = generateMockSelectProduct();
			await ProductModel.create(mockProduct);

			// Act & Assert
			const noProductCached = cacheService.get({
				key: mockProduct._id.toString(),
			});
			assert.strictEqual(noProductCached.success, true);
			assert.strictEqual(noProductCached.data, undefined);

			await productRepository.getById({
				productId: mockProduct._id,
			});

			const cachedProduct = cacheService.get<SelectProduct>({
				key: mockProduct._id.toString(),
			});
			assert.ok(cachedProduct.success);
			assert.ok(cachedProduct.data);
			assert.strictEqual(cachedProduct.data.name, mockProduct.name);
		});

		test("should return null when 'db.findById' is called with non-existent ID", async () => {
			// Arrange
			const nonExistentId = new Types.ObjectId();

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
			const invalidId = "invalid-id" as unknown as Types.ObjectId;

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
			const mockProduct = generateMockSelectProduct();
			await productRepository.create(mockProduct);
			const updateData = {
				name: "Updated Product Name",
				price: 999,
			};

			// Act
			const updatedProduct = await productRepository.update({
				data: updateData,
				productId: mockProduct._id,
			});

			// Assert
			assert.strictEqual(updatedProduct.success, true);
			assert.ok(updatedProduct.data);
			assert.equal(updatedProduct.data.name, updateData.name);
			assert.equal(updatedProduct.data.price, updateData.price);
			// Verify other fields remain unchanged
			assert.equal(updatedProduct.data.brand, mockProduct.brand);
			assert.equal(updatedProduct.data.category, mockProduct.category);
		});

		test("should update the cached product when 'db.update' is called", async () => {
			// Arrange
			const mockProduct = generateMockSelectProduct();
			await productRepository.create(mockProduct);
			const cacheKey = mockProduct._id.toString();

			const updateData = { name: "Updated Product Name" };

			// Act
			await productRepository.update({
				data: updateData,
				productId: mockProduct._id,
			});
			const cachedProduct = cacheService.get<SelectProduct>({
				key: cacheKey,
			});

			// Assert
			assert.strictEqual(cachedProduct.success, true);
			assert.ok(cachedProduct.data);
			assert.strictEqual(cachedProduct.data.name, updateData.name);
		});

		test("should return null when 'db.update' is called with non-existent ID", async () => {
			// Arrange
			const nonExistentId = new Types.ObjectId();
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
			const mockProduct = generateMockSelectProduct();
			await ProductModel.create(mockProduct);
			const invalidData = { price: "invalid-price" as unknown as number };

			// Act
			const result = await productRepository.update({
				data: invalidData,
				productId: mockProduct._id,
			});

			// Assert
			assert.strictEqual(result.success, false);
			assert.ok(result.error instanceof DatabaseValidationError);
		});

		test("should return DatabaseValidationError when 'update' is called with invalid ObjectId", async () => {
			// Arrange
			const invalidId = "invalid-id" as unknown as Types.ObjectId;
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
			const mockProduct = generateMockSelectProduct();
			await productRepository.create(mockProduct);

			// Act
			const deletedProduct = await productRepository.delete({
				productId: mockProduct._id,
			});

			// Assert
			assert.strictEqual(deletedProduct.success, true);
			assert.ok(deletedProduct.data);
			assert.equal(deletedProduct.data.name, mockProduct.name);
			assert.equal(deletedProduct.data.description, mockProduct.description);
			assert.equal(deletedProduct.data.brand, mockProduct.brand);
			assert.equal(deletedProduct.data.category, mockProduct.category);
			assert.equal(deletedProduct.data.price, mockProduct.price);
			assert.equal(deletedProduct.data.countInStock, mockProduct.countInStock);
			assert.equal(deletedProduct.data.image, mockProduct.image);
			assert.equal(deletedProduct.data.rating, mockProduct.rating);
			assert.equal(deletedProduct.data.numReviews, mockProduct.numReviews);

			// Verify product is actually deleted
			const isProductExists = await ProductModel.findById(
				mockProduct._id,
			).lean();
			assert.strictEqual(isProductExists, null);
		});

		test("should invalidate product cache when 'db.delete' is called successfully", async () => {
			// Arrange
			const mockProduct = generateMockSelectProduct();
			await productRepository.create(mockProduct);
			const cacheKey = mockProduct._id.toString();

			// Act
			await productRepository.delete({ productId: mockProduct._id });

			// Assert
			const cachedProduct = cacheService.get<SelectProduct>({
				key: cacheKey,
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
			const invalidId = "invalid-id" as unknown as Types.ObjectId;

			// Act
			const result = await productRepository.delete({ productId: invalidId });

			// Assert
			assert.strictEqual(result.success, false);
			assert.ok(result.error instanceof DatabaseValidationError);
		});

		describe("count", () => {
			test("should return total count when 'db.count' is called without query", async () => {
				// Arrange
				const mockProducts = generateMockSelectProducts({ count: 3 });
				await ProductModel.insertMany(mockProducts);

				// Act
				const count = await productRepository.count({});

				// Assert
				assert.strictEqual(count.success, true);
				assert.strictEqual(count.data, mockProducts.length);
			});

			test("should return filtered count when 'db.count' is called with query filters", async () => {
				// Arrange
				const mockProducts = generateMockSelectProducts({ count: 5 });
				const targetBrand = mockProducts[0].brand;
				const productsWithTargetBrand = mockProducts.filter(
					(p) => p.brand === targetBrand,
				);
				await ProductModel.insertMany(mockProducts);

				// Act
				const count = await productRepository.count({ brand: targetBrand });

				// Assert
				assert.strictEqual(count.success, true);
				assert.strictEqual(count.data, productsWithTargetBrand.length);
			});

			test("should return 0 when 'db.count' is called and no products match criteria", async () => {
				// Arrange
				const mockProducts = generateMockSelectProducts({ count: 3 });
				await ProductModel.insertMany(mockProducts);

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
