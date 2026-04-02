import assert from "node:assert";
import test, { after, before, beforeEach, describe, suite } from "node:test";

import { MAX_TOP_RATED_PRODUCTS } from "../../constants/product.constants.js";
import { NotFoundError, ValidationError } from "../../errors/index.js";
import Product from "../../models/product.model.js";
import { ProductRepository } from "../../repositories/index.js";
import { CacheService, ProductService } from "../../services/index.js";
import { generateMockObjectId } from "../mocks/index.js";
import {
	generateMockInsertProductWithStringImage,
	generateMockSelectProduct,
	generateMockSelectProducts,
} from "../mocks/product.mock.js";
import { connectTestDatabase, disconnectTestDatabase } from "../utils/index.js";

suite("Product Service 〖 Integration Tests 〗", async () => {
	let productService: ProductService;
	let productRepository: ProductRepository;
	let cacheService: CacheService;

	before(async () => {
		await connectTestDatabase();
		cacheService = new CacheService("product");
		productRepository = new ProductRepository(Product, cacheService);
		productService = new ProductService(productRepository);
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
		test("should create and return product when 'repo.create' is called with valid data", async () => {
			// Arrange
			const mockProduct = generateMockInsertProductWithStringImage();

			// Act
			const result = await productService.create(mockProduct);

			// Assert
			assert.strictEqual(result.success, true);

			assert.ok(result.data._id);
			assert.strictEqual(result.data.name, mockProduct.name);
			assert.strictEqual(result.data.brand, mockProduct.brand);
			assert.strictEqual(result.data.category, mockProduct.category);
			assert.strictEqual(result.data.description, mockProduct.description);
			assert.strictEqual(result.data.price, mockProduct.price);
			assert.strictEqual(result.data.countInStock, mockProduct.countInStock);
			assert.strictEqual(result.data.image, mockProduct.image);
			assert.strictEqual(result.data.rating, 0);
			assert.strictEqual(result.data.numReviews, 0);
		});

		test("should return validation error when 'repo.create' is called with invalid data", async () => {
			// Arrange
			const invalidProduct = {
				...generateMockInsertProductWithStringImage(),
				price: "invalid-price" as unknown as number,
			};

			// Act
			const result = await productService.create(invalidProduct);

			// Assert
			assert.strictEqual(result.success, false);
			assert.ok(result.error instanceof ValidationError);
		});

		test("Should return validation error when 'repo.create' is called without required fields", async () => {
			// Arrange
			const { name: _name, ...mockProduct } =
				generateMockInsertProductWithStringImage();

			// Act
			// @ts-expect-error - test case
			const result = await productService.create(mockProduct);

			// Assert
			assert.strictEqual(result.success, false);
			assert.ok(result.error instanceof ValidationError);
		});
	});

	describe("getAll", () => {
		test("should return paginated response with items and meta when 'getAll' is called with valid parameters", async () => {
			// Arrange
			const mockProducts = generateMockSelectProducts({ count: 5 });
			await Product.insertMany(mockProducts);

			// Act
			const result = await productService.getAll({
				pageNumber: "1",
				pageSize: "10",
			});

			// Assert
			assert.strictEqual(result.success, true);
			assert.ok(result.data);
			assert.ok(result.data.meta);
			assert.ok(Array.isArray(result.data.items));
			assert.strictEqual(result.data.items.length, mockProducts.length);
		});

		test("should return correct pagination meta when 'getAll' is called", async () => {
			// Arrange
			const mockProducts = generateMockSelectProducts({ count: 5 });
			await Product.insertMany(mockProducts);

			// Act
			const result = await productService.getAll({
				pageNumber: "1",
				pageSize: "10",
			});

			// Assert
			assert.strictEqual(result.success, true);
			assert.strictEqual(result.data.meta.currentPage, 1);
			assert.strictEqual(result.data.meta.pageSize, 10);
			assert.strictEqual(result.data.meta.totalItems, 5);
			assert.strictEqual(result.data.meta.totalPages, 1);
			assert.strictEqual(result.data.meta.hasNextPage, false);
			assert.strictEqual(result.data.meta.hasPreviousPage, false);
		});

		test("should return correct number of items per page when 'getAll' is called with specific pageSize", async () => {
			// Arrange
			const mockProducts = generateMockSelectProducts({ count: 5 });
			const pageSize = "2";
			await Product.insertMany(mockProducts);

			// Act
			const result = await productService.getAll({
				pageNumber: "1",
				pageSize,
			});

			// Assert
			assert.strictEqual(result.success, true);
			assert.strictEqual(result.data.items.length, 2);
			assert.strictEqual(result.data.meta.pageSize, 2);
		});

		test("should return correct page of items when 'getAll' is called with specific pageNumber", async () => {
			// Arrange
			const mockProducts = generateMockSelectProducts({ count: 5 });
			const pageSize = "2";
			const pageNumber = "2";
			await Product.insertMany(mockProducts);

			// Act
			const result = await productService.getAll({
				pageNumber,
				pageSize,
			});

			// Assert
			assert.strictEqual(result.success, true);
			assert.strictEqual(result.data.items.length, 2);
			assert.strictEqual(result.data.meta.currentPage, 2);
		});

		test("should return correct pagination meta for multiple pages when 'getAll' is called", async () => {
			// Arrange
			const mockProducts = generateMockSelectProducts({ count: 5 });
			const pageSize = "2";
			const pageNumber = "2";
			await Product.insertMany(mockProducts);

			// Act
			const result = await productService.getAll({
				pageNumber,
				pageSize,
			});

			// Assert
			assert.strictEqual(result.success, true);
			assert.strictEqual(result.data.meta.currentPage, 2);
			assert.strictEqual(result.data.meta.pageSize, 2);
			assert.strictEqual(result.data.meta.totalItems, 5);
			assert.strictEqual(result.data.meta.totalPages, 3);
			assert.strictEqual(result.data.meta.hasNextPage, true);
			assert.strictEqual(result.data.meta.hasPreviousPage, true);
		});

		test("should return filtered items when 'getAll' is called with search keyword", async () => {
			// Arrange
			const mockProducts = generateMockSelectProducts({ count: 5 });
			const keyword = mockProducts[0].name;
			await Product.insertMany(mockProducts);

			// Act
			const result = await productService.getAll({
				pageNumber: "1",
				pageSize: "10",
				filters: { keyword },
			});

			// Assert
			assert.strictEqual(result.success, true);
			assert.ok(Array.isArray(result.data.items));
			assert.ok(result.data.items.length > 0);
		});

		test("should return empty items array when 'getAll' is called with non-existent keyword", async () => {
			// Arrange
			const mockProducts = generateMockSelectProducts({ count: 5 });
			const keyword = "nonexistentproduct";
			await Product.insertMany(mockProducts);

			// Act
			const result = await productService.getAll({
				pageNumber: "1",
				pageSize: "10",
				filters: { keyword },
			});

			// Assert
			assert.strictEqual(result.success, true);
			assert.strictEqual(result.data.items.length, 0);
			assert.strictEqual(result.data.meta.totalItems, 0);
		});

		test("should return correct pagination meta when no products match keyword", async () => {
			// Arrange
			const mockProducts = generateMockSelectProducts({ count: 5 });
			const keyword = "nonexistentproduct";
			await Product.insertMany(mockProducts);

			// Act
			const result = await productService.getAll({
				pageNumber: "1",
				pageSize: "10",
				filters: { keyword },
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

		test("should return items with correct structure when 'getAll' is called", async () => {
			// Arrange
			const mockProducts = generateMockSelectProducts({ count: 1 });
			await Product.insertMany(mockProducts);

			// Act
			const result = await productService.getAll({
				pageNumber: "1",
				pageSize: "10",
			});

			// Assert
			assert.strictEqual(result.success, true);
			assert.strictEqual(result.data.items.length, 1);

			const product = result.data.items[0];
			assert.ok(product._id);
			assert.ok(typeof product.name === "string");
			assert.ok(typeof product.brand === "string");
			assert.ok(typeof product.category === "string");
			assert.ok(typeof product.price === "number");
			assert.ok(typeof product.rating === "number");
		});

		test("should return validation error when 'pageNumber' is invalid", async () => {
			// Act
			const result = await productService.getAll({
				pageNumber: "invalid",
				pageSize: "10",
			});

			// Assert
			assert.strictEqual(result.success, false);
			assert.ok(result.error instanceof ValidationError);
		});

		test("should return validation error when 'pageSize' is invalid", async () => {
			// Act
			const result = await productService.getAll({
				pageNumber: "1",
				pageSize: "invalid",
			});

			// Assert
			assert.strictEqual(result.success, false);
			assert.ok(result.error instanceof ValidationError);
		});

		test("should return validation error when 'pageNumber' is zero", async () => {
			// Act
			const result = await productService.getAll({
				pageNumber: "0",
				pageSize: "10",
			});

			// Assert
			assert.strictEqual(result.success, false);
			assert.ok(result.error instanceof ValidationError);
		});

		test("should return validation error when 'pageNumber' is negative", async () => {
			// Act
			const result = await productService.getAll({
				pageNumber: "-1",
				pageSize: "10",
			});

			// Assert
			assert.strictEqual(result.success, false);
			assert.ok(result.error instanceof ValidationError);
		});

		test("should return validation error when 'pageSize' is zero", async () => {
			// Act
			const result = await productService.getAll({
				pageNumber: "1",
				pageSize: "0",
			});

			// Assert
			assert.strictEqual(result.success, false);
			assert.ok(result.error instanceof ValidationError);
		});

		test("should return validation error when 'pageSize' is negative", async () => {
			// Act
			const result = await productService.getAll({
				pageNumber: "1",
				pageSize: "-1",
			});

			// Assert
			assert.strictEqual(result.success, false);
			assert.ok(result.error instanceof ValidationError);
		});
	});

	describe("getTopRated", () => {
		test("should return top rated products sorted by rating when 'repo.getTopRated' is called", async () => {
			// Arrange
			const mockProducts = generateMockSelectProducts({ count: 5 });
			const expectedResult = (await Product.insertMany(mockProducts))
				.map((p) => ({
					_id: p._id.toString(),
					image: p.image,
					name: p.name,
					price: p.price,
				}))
				.slice(0, 3);

			// Act
			const result = await productService.getTopRated();

			// Assert
			assert.strictEqual(result.success, true);
			assert.ok(result.data.length > 0);

			const resultWithStringId = result.data.map((product) => ({
				...product,
				_id: product._id.toString(),
			}));
			assert.deepStrictEqual(resultWithStringId, expectedResult);
		});

		test("should return at most MAX_TOP_RATED_PRODUCTS products when 'repo.getTopRated' is called", async () => {
			// Arrange
			const mockProducts = generateMockSelectProducts({ count: 10 });
			await Product.insertMany(mockProducts);

			// Act
			const result = await productService.getTopRated();

			// Assert
			assert.strictEqual(result.success, true);
			assert.strictEqual(result.data.length, MAX_TOP_RATED_PRODUCTS);
		});

		test("should return only id, name, price and image fields for each product", async () => {
			// Arrange
			const mockProducts = generateMockSelectProducts({ count: 3 });
			await Product.insertMany(mockProducts);

			// Act
			const result = await productService.getTopRated();

			// Assert
			assert.strictEqual(result.success, true);
			result.data.forEach((product) => {
				const keys = Object.keys(product);
				assert.ok(keys.includes("_id"));
				assert.ok(keys.includes("name"));
				assert.ok(keys.includes("price"));
				assert.ok(keys.includes("image"));
				assert.strictEqual(keys.length, 4);
			});
		});

		test("should return empty array when 'repo.getTopRated' is called and no products exist", async () => {
			// Arrange - database is already empty from beforeEach

			// Act
			const result = await productService.getTopRated();

			// Assert
			assert.strictEqual(result.success, true);
			assert.strictEqual(result.data.length, 0);
		});
	});

	describe("getById", () => {
		test("should return product when 'repo.getById' is called with valid ID", async () => {
			// Arrange
			const mockProduct = generateMockSelectProduct();
			const productId = mockProduct._id.toString();
			await Product.create(mockProduct);

			// Act
			const result = await productService.getById({
				productId,
			});

			// Assert
			assert.strictEqual(result.success, true);
			assert.strictEqual(result.data._id.toString(), productId);
			assert.strictEqual(result.data.name, mockProduct.name);
			assert.strictEqual(result.data.brand, mockProduct.brand);
			assert.strictEqual(result.data.category, mockProduct.category);
			assert.strictEqual(result.data.description, mockProduct.description);
			assert.strictEqual(result.data.price, mockProduct.price);
			assert.strictEqual(result.data.countInStock, mockProduct.countInStock);
			assert.strictEqual(result.data.image, mockProduct.image);
		});

		test("should return not found error when 'repo.getById' is called with non-existent ID", async () => {
			// Arrange
			const nonExistentId = generateMockObjectId().toString();

			// Act
			const result = await productService.getById({ productId: nonExistentId });

			// Assert
			assert.strictEqual(result.success, false);
			assert.ok(result.error instanceof NotFoundError);
		});

		test("should return validation error when 'repo.getById' is called with invalid 'productId'", async () => {
			// Arrange
			const productId = "invalid-product-id";

			// Act
			const result = await productService.getById({ productId });

			// Assert
			assert.strictEqual(result.success, false);
			assert.ok(result.error instanceof ValidationError);
		});
	});

	describe("update", () => {
		test("should update and persist product when 'repo.update' is called with valid data", async () => {
			// Arrange
			const mockProduct = generateMockSelectProduct();
			const productId = mockProduct._id.toString();
			await productRepository.create(mockProduct);
			const updateData = {
				name: "Updated Product Name",
				price: 999,
			};

			// Act
			const result = await productService.update({
				data: updateData,
				productId,
			});

			// Assert
			assert.strictEqual(result.success, true);
			assert.strictEqual(result.data.name, updateData.name);
			assert.strictEqual(result.data.price, updateData.price);

			// Verify other fields remain unchanged
			assert.strictEqual(result.data.brand, mockProduct.brand);
			assert.strictEqual(result.data.category, mockProduct.category);
			assert.strictEqual(result.data.image, mockProduct.image);
		});

		test("should keep existing image when 'repo.update' is called without new image", async () => {
			// Arrange
			const mockProduct = generateMockSelectProduct();
			const productId = mockProduct._id.toString();
			await productRepository.create(mockProduct);
			const updateData = {
				name: "Updated Product Name",
			};

			// Act
			const result = await productService.update({
				data: updateData,
				productId,
			});

			// Assert
			assert.strictEqual(result.success, true);
			assert.strictEqual(result.data.image, mockProduct.image);
		});

		test("should return not found error when 'repo.update' is called with non-existent ID", async () => {
			// Arrange
			const nonExistentId = generateMockObjectId().toString();
			const updateData = { name: "Updated Product Name" };

			// Act
			const result = await productService.update({
				data: updateData,
				productId: nonExistentId,
			});

			// Assert
			assert.strictEqual(result.success, false);
			assert.ok(result.error instanceof NotFoundError);
		});

		test("should return validation error when 'repo.update' is called with invalid data", async () => {
			// Arrange
			const mockProduct = generateMockSelectProduct();
			const productId = mockProduct._id.toString();
			await Product.create(mockProduct);
			const invalidData = { price: "invalid-price" as unknown as number };

			// Act
			const result = await productService.update({
				data: invalidData,
				productId,
			});

			// Assert
			assert.strictEqual(result.success, false);
			assert.ok(result.error instanceof ValidationError);
		});

		test("Should return validation error when 'repo.update' is called with invalid 'productId'", async () => {
			// Arrange
			const productId = "invalid-product-id";
			const updateData = { name: "Updated Product Name" };

			// Act
			const result = await productService.update({
				data: updateData,
				productId,
			});

			// Assert
			assert.strictEqual(result.success, false);
			assert.ok(result.error instanceof ValidationError);
		});
	});

	describe("delete", () => {
		test("should delete product when 'repo.delete' is called with valid ID", async () => {
			// Arrange
			const mockProduct = generateMockSelectProduct();
			const productId = mockProduct._id.toString();
			await productRepository.create(mockProduct);

			// Act
			const result = await productService.delete({ productId });

			// Assert
			assert.strictEqual(result.success, true);
			const deletedProduct = await Product.findById(mockProduct._id);
			assert.strictEqual(deletedProduct, null);
		});

		test("should return not found error when 'repo.delete' is called with non-existent ID", async () => {
			// Arrange
			const nonExistentId = generateMockObjectId().toString();

			// Act
			const result = await productService.delete({ productId: nonExistentId });

			// Assert
			assert.strictEqual(result.success, false);
			assert.ok(result.error instanceof NotFoundError);
		});

		test("should return validation error when 'repo.delete' is called with invalid 'productId'", async () => {
			// Arrange
			const productId = "invalid-product-id";

			// Act
			const result = await productService.delete({ productId });

			// Assert
			assert.strictEqual(result.success, false);
			assert.ok(result.error instanceof ValidationError);
		});
	});
});
