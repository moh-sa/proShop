import assert from "node:assert";
import test, { after, before, beforeEach, describe, suite } from "node:test";

import { MAX_TOP_RATED_PRODUCTS } from "../../constants/product.constants.js";
import { NotFoundError, ValidationError } from "../../errors/index.js";
import Product from "../../models/product.model.js";
import { ProductRepository } from "../../repositories/index.js";
import { CacheService, ProductService } from "../../services/index.js";
import {
	generateMockObjectId,
	mockImageStorage,
	mockMulterImageFile,
} from "../mocks/index.js";
import {
	generateMockInsertProductWithMulterImage,
	generateMockSelectProduct,
	generateMockSelectProducts,
} from "../mocks/product.mock.js";
import { connectTestDatabase, disconnectTestDatabase } from "../utils/index.js";

suite("Product Service 〖 Integration Tests 〗", async () => {
	let productService: ProductService;
	let productRepository: ProductRepository;
	let cacheService: CacheService;
	let imageStorageMock: ReturnType<typeof mockImageStorage>; // Don't have storage for testing

	before(async () => {
		await connectTestDatabase();
		cacheService = new CacheService("product");
		productRepository = new ProductRepository(Product, cacheService);
		imageStorageMock = mockImageStorage();
		productService = new ProductService(productRepository, imageStorageMock);
	});

	after(async () => {
		await Product.deleteMany({});
		await disconnectTestDatabase();
	});

	beforeEach(async () => {
		await Product.deleteMany({});
		cacheService.flush();
		imageStorageMock.reset();
	});

	describe("create", () => {
		test("should create and return product when 'repo.create' is called with valid data", async () => {
			// Arrange
			const mockProduct = generateMockInsertProductWithMulterImage();
			const mockImageUrl = "https://example.com/image.jpg";
			imageStorageMock.upload.mock.mockImplementationOnce(async () => ({
				data: mockImageUrl,
				success: true,
			}));

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
			assert.strictEqual(result.data.image, mockImageUrl);
			assert.strictEqual(result.data.rating, 0);
			assert.strictEqual(result.data.numReviews, 0);

			assert.strictEqual(imageStorageMock.upload.mock.calls.length, 1);
			assert.deepStrictEqual(
				imageStorageMock.upload.mock.calls[0].arguments[0].file,
				mockProduct.image,
			);
		});

		test("should upload image to storage when 'repo.create' is called with valid image", async () => {
			// Arrange
			const mockProduct = generateMockInsertProductWithMulterImage();
			const mockImageUrl = "https://example.com/image.jpg";
			imageStorageMock.upload.mock.mockImplementationOnce(async () => ({
				data: mockImageUrl,
				success: true,
			}));

			// Act
			const result = await productService.create(mockProduct);

			// Assert
			assert.strictEqual(result.success, true);
			assert.strictEqual(imageStorageMock.upload.mock.calls.length, 1);
			assert.deepStrictEqual(
				imageStorageMock.upload.mock.calls[0].arguments[0].file,
				mockProduct.image,
			);
		});

		test("should return validation error when 'repo.create' is called with invalid data", async () => {
			// Arrange
			const invalidProduct = {
				...generateMockInsertProductWithMulterImage(),
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
				generateMockInsertProductWithMulterImage();

			// Act
			// @ts-expect-error - test case
			const result = await productService.create(mockProduct);

			// Assert
			assert.strictEqual(result.success, false);
			assert.ok(result.error instanceof ValidationError);
		});
	});

	describe("getAll", () => {
		test("should return response with products, currentPage and numberOfPages fields", async () => {
			// Arrange
			const mockProducts = generateMockSelectProducts({ count: 5 });
			await Product.insertMany(mockProducts);
			const keyword = "";
			const currentPage = "1";

			// Act
			const result = await productService.getAll({ currentPage, keyword });

			// Assert
			assert.strictEqual(result.success, true);
			assert.ok(Array.isArray(result.data.products));
			assert.strictEqual(typeof result.data.currentPage, "number");
			assert.strictEqual(typeof result.data.numberOfPages, "number");
			assert.strictEqual(result.data.products.length, mockProducts.length);
		});

		test("should return filtered products when 'repo.getAll' is called with search keyword", async () => {
			// Arrange
			const mockProducts = generateMockSelectProducts({ count: 5 });
			await Product.insertMany(mockProducts);
			const keyword = mockProducts[0].name.substring(0, 3);
			const currentPage = "1";

			// Act
			const result = await productService.getAll({ currentPage, keyword });

			// Assert
			assert.strictEqual(result.success, true);
			assert.ok(result.data.products.length > 0);

			result.data.products.forEach((product) => {
				assert.ok(product.name.toLowerCase().includes(keyword.toLowerCase()));
			});
		});

		test("should return correct page when 'repo.getAll' is called with specific page number", async () => {
			// Arrange
			const mockProducts = generateMockSelectProducts({ count: 15 }); // Create enough products for multiple pages
			await Product.insertMany(mockProducts);
			const keyword = "";
			const currentPage = "2";

			// Act
			const result = await productService.getAll({ currentPage, keyword });

			// Assert
			assert.strictEqual(result.success, true);
			assert.strictEqual(result.data.currentPage, Number(currentPage));
			assert.ok(result.data.products.length > 0);

			// Get first page to compare
			const firstPageResult = await productService.getAll({
				currentPage: "1",
				keyword,
			});
			assert.strictEqual(firstPageResult.success, true);
			const firstPageIds = firstPageResult.data.products.map((p) =>
				p._id.toString(),
			);
			const secondPageIds = result.data.products.map((p) => p._id.toString());

			// Ensure no overlap between pages
			const overlap = firstPageIds.some((id) => secondPageIds.includes(id));
			assert.strictEqual(overlap, false);
		});

		test("should return empty products array when 'repo.getAll' is called and no products match keyword", async () => {
			// Arrange
			const mockProducts = generateMockSelectProducts({ count: 5 });
			await Product.insertMany(mockProducts);
			const keyword = "nonexistentproduct";
			const currentPage = "1";

			// Act
			const result = await productService.getAll({ currentPage, keyword });

			// Assert
			assert.strictEqual(result.success, true);
			assert.strictEqual(result.data.products.length, 0);
			assert.strictEqual(result.data.currentPage, Number(currentPage));
			assert.strictEqual(result.data.numberOfPages, 1);
		});

		test("should return first page when 'repo.getAll' is called without page number", async () => {
			// Arrange
			const mockProducts = generateMockSelectProducts({ count: 5 });
			await Product.insertMany(mockProducts);
			const keyword = "";
			const currentPage = undefined as unknown as string;

			// Act
			const result = await productService.getAll({ currentPage, keyword });

			// Assert
			assert.strictEqual(result.success, true);
			assert.strictEqual(result.data.currentPage, 1);
			assert.ok(result.data.products.length > 0);
		});

		test("should calculate total number of pages correctly based on products per page", async () => {
			// Arrange
			const mockProducts = generateMockSelectProducts({ count: 25 }); // Create enough products for multiple pages
			await Product.insertMany(mockProducts);
			const keyword = "";
			const currentPage = "1";
			const productsPerPage = 10;

			// Act
			const result = await productService.getAll({ currentPage, keyword });

			// Assert
			assert.strictEqual(result.success, true);
			const expectedPages = Math.ceil(mockProducts.length / productsPerPage);
			assert.strictEqual(result.data.numberOfPages, expectedPages);
		});

		test("Should return validation error when 'service.getAll' is called with invalid 'currentPage' query", async () => {
			// Arrange
			const currentPage = "invalid-number";
			const keyword = "";

			// Act
			const result = await productService.getAll({ currentPage, keyword });

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
			assert.strictEqual(imageStorageMock.replace.mock.calls.length, 0);
		});

		test("should replace old image with new one in storage when updating product image", async () => {
			// Arrange
			const mockProduct = generateMockSelectProduct();
			const productId = mockProduct._id.toString();
			await Product.create(mockProduct);
			const newImage = mockMulterImageFile();
			const newImageUrl = "https://example.com/new-image.jpg";
			const updateData = {
				image: newImage,
				name: "Updated Product Name",
			};
			imageStorageMock.replace.mock.mockImplementationOnce(async () => ({
				data: newImageUrl,
				success: true,
			}));

			// Act
			const result = await productService.update({
				data: updateData,
				productId,
			});

			// Assert
			assert.strictEqual(result.success, true);
			assert.strictEqual(result.data.image, newImageUrl);
			assert.strictEqual(imageStorageMock.replace.mock.calls.length, 1);
			assert.deepStrictEqual(
				imageStorageMock.replace.mock.calls[0].arguments[0].file,
				newImage,
			);
			assert.deepStrictEqual(
				imageStorageMock.replace.mock.calls[0].arguments[0].url,
				mockProduct.image,
			);
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
			imageStorageMock.delete.mock.mockImplementationOnce(async () => ({
				data: undefined,
				success: true,
			}));

			// Act
			const result = await productService.delete({ productId });

			// Assert
			assert.strictEqual(result.success, true);
			const deletedProduct = await Product.findById(mockProduct._id);
			assert.strictEqual(deletedProduct, null);
			assert.strictEqual(imageStorageMock.delete.mock.calls.length, 1);
			assert.deepStrictEqual(
				imageStorageMock.delete.mock.calls[0].arguments[0].url,
				mockProduct.image,
			);
		});

		test("should verify image is actually deleted from storage", async () => {
			// Arrange
			const mockProduct = generateMockSelectProduct();
			const productId = mockProduct._id.toString();
			await productRepository.create(mockProduct);

			imageStorageMock.delete.mock.mockImplementationOnce(async () => {
				return {
					data: undefined,
					success: true,
				};
			});

			// Act
			const result = await productService.delete({ productId });

			// Assert
			assert.strictEqual(result.success, true);
			assert.strictEqual(imageStorageMock.delete.mock.calls.length, 1);
		});

		test("should handle case where storage deletion fails but product was deleted", async () => {
			// Arrange
			const mockProduct = generateMockSelectProduct();
			const productId = mockProduct._id.toString();
			await productRepository.create(mockProduct);
			const mockError = new Error("Delete failed");

			imageStorageMock.delete.mock.mockImplementationOnce(() =>
				Promise.resolve({ error: mockError, success: false }),
			);

			// Act
			const result = await productService.delete({ productId });

			// Assert
			assert.strictEqual(result.success, false);
			assert.strictEqual(result.error, mockError);

			// Verify product was still deleted from database
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
