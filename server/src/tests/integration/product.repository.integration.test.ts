import { Types } from "mongoose";
import assert from "node:assert";
import test, { after, before, beforeEach, describe, suite } from "node:test";

import type { SelectProduct, TopRatedProduct } from "../../types/index.js";

import { DatabaseValidationError } from "../../errors/index.js";
import Product from "../../models/product.model.js";
import { ProductRepository } from "../../repositories/index.js";
import { CacheService } from "../../services/index.js";
import { removeObjectFields } from "../../utils/index.js";
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
		productRepository = new ProductRepository(Product, cacheService);
	});

	after(async () => {
		await Product.deleteMany({});
		await disconnectTestDatabase();
	});

	beforeEach(async () => {
		await Product.deleteMany({});
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
		test("should return cached products when 'db.find' is called with page that exists in cache", async () => {
			// Arrange
			const mockProducts = generateMockSelectProducts({ count: 3 });
			await Promise.all(
				mockProducts.map(
					async (product) => await productRepository.create(product),
				),
			);

			// Act
			const products = await productRepository.getAll({
				currentPage: 1,
				numberOfProductsPerPage: 10,
				query: {},
			});

			// Assert
			assert.strictEqual(products.success, true);
			assert.ok(Array.isArray(products.data));
			assert.ok(products.data.length > 0);
			assert.strictEqual(products.data.length, mockProducts.length);

			const assertProducts = products.data.filter((product) => !product._id);
			const assertMockProducts = mockProducts.map((product) => {
				return removeObjectFields(product, [
					"_id",
					"user",
					"countInStock",
					"createdAt",
					"updatedAt",
					"description",
				]);
			});

			assertProducts.forEach((product) => {
				// @ts-expect-error - apparently, `removeObjectFields` does not update the type
				assert.ok(assertMockProducts.includes(product));
			});
		});

		test("should return correct number of products per page when 'db.find' is called", async () => {
			// Arrange
			const mockProducts = generateMockSelectProducts({ count: 5 });
			await Product.insertMany(mockProducts);
			const productsPerPage = 2;

			// Act
			const products = await productRepository.getAll({
				currentPage: 1,
				numberOfProductsPerPage: productsPerPage,
				query: {},
			});

			// Assert
			assert.strictEqual(products.success, true);
			assert.ok(Array.isArray(products.data));
			assert.equal(products.data.length, productsPerPage);
		});

		test("should return correct page of products when 'db.find' is called with specific page", async () => {
			// Arrange
			const mockProducts = generateMockSelectProducts({ count: 5 });
			await Product.insertMany(mockProducts);
			const productsPerPage = 2;
			const page = 2;

			// Act
			const products = await productRepository.getAll({
				currentPage: page,
				numberOfProductsPerPage: productsPerPage,
				query: {},
			});

			// Assert
			assert.strictEqual(products.success, true);
			assert.ok(Array.isArray(products.data));
			assert.equal(products.data.length, productsPerPage);
		});

		test("should return filtered products when 'getAll' is called with query filters", async () => {
			// Arrange
			const mockProducts = generateMockSelectProducts({ count: 5 });
			const targetBrand = mockProducts[0].brand;
			await Product.insertMany(mockProducts);

			// Act
			const products = await productRepository.getAll({
				currentPage: 1,
				numberOfProductsPerPage: 10,
				query: { brand: targetBrand },
			});

			// Assert
			assert.strictEqual(products.success, true);
			assert.ok(Array.isArray(products.data));
			assert.ok(products.data.length > 0);
			products.data.forEach((product) => {
				assert.equal(product.brand, targetBrand);
			});
		});

		test("should return empty array when 'getAll' is called and no products match criteria", async () => {
			// Arrange
			const mockProducts = generateMockSelectProducts({ count: 3 });
			await Product.insertMany(mockProducts);

			// Act
			const products = await productRepository.getAll({
				currentPage: 1,
				numberOfProductsPerPage: 10,
				query: { brand: "Non-existent Brand" },
			});

			// Assert
			assert.strictEqual(products.success, true);
			assert.ok(Array.isArray(products.data));
			assert.strictEqual(products.data.length, 0);
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
			await Product.insertMany(mockProducts);

			// Act & Assert
			const noProductsCached = cacheService.get({ key: "top-rated" });
			assert.strictEqual(noProductsCached.success, false);

			const products = await productRepository.getTopRated({ limit: 3 });
			assert.strictEqual(products.success, true);
			assert.ok(Array.isArray(products.data));
			assert.strictEqual(products.data.length, mockProducts.length);

			const cachedProducts = cacheService.get<Array<TopRatedProduct>>({
				key: "top-rated",
			});
			assert.ok(cachedProducts.success);
			assert.strictEqual(cachedProducts.data.length, mockProducts.length);
		});

		test("should return correct number of products when 'db.getTopRated' is called with limit", async () => {
			// Arrange
			const mockProducts = generateMockSelectProducts({ count: 5 });
			await Product.insertMany(mockProducts);
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
			await Product.insertMany(mockProducts);

			// Act
			const products = await productRepository.getTopRated({ limit: 3 });

			// Assert
			assert.strictEqual(products.success, true);
			assert.ok(Array.isArray(products.data));
			assert.strictEqual(products.data.length, numberOfProducts);

			for (let i = 1; i < products.data.length; i++) {
				const prevProduct = await Product.findById(
					products.data[i - 1]._id,
				).lean();
				const currentProduct = await Product.findById(
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
			await Product.create(mockProduct);

			// Act & Assert
			const noProductCached = cacheService.get({
				key: mockProduct._id.toString(),
			});
			assert.strictEqual(noProductCached.success, false);

			await productRepository.getById({
				productId: mockProduct._id,
			});

			const cachedProduct = cacheService.get<SelectProduct>({
				key: mockProduct._id.toString(),
			});
			assert.ok(cachedProduct.success);
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

		test("should invalidate product cache when 'db.update' is called successfully", async () => {
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
			assert.strictEqual(cachedProduct.success, false);
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
			await Product.create(mockProduct);
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
			const isProductExists = await Product.findById(mockProduct._id).lean();
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
			assert.strictEqual(cachedProduct.success, false);
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
				await Product.insertMany(mockProducts);

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
				await Product.insertMany(mockProducts);

				// Act
				const count = await productRepository.count({ brand: targetBrand });

				// Assert
				assert.strictEqual(count.success, true);
				assert.strictEqual(count.data, productsWithTargetBrand.length);
			});

			test("should return 0 when 'db.count' is called and no products match criteria", async () => {
				// Arrange
				const mockProducts = generateMockSelectProducts({ count: 3 });
				await Product.insertMany(mockProducts);

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
