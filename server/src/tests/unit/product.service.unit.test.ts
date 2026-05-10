import assert from "node:assert/strict";
import test, { beforeEach, describe, suite } from "node:test";

import {
	DatabaseBaseError,
	NotFoundError,
	ValidationError,
} from "../../errors/index.js";
import { ProductService } from "../../services/index.js";
import {
	generateMockInsertProductWithMulterImage,
	generateMockSelectProduct,
	generateMockSelectProducts,
	mockProductRepository,
} from "../mocks/index.js";

suite("Product Service 〖 Unit Tests 〗", () => {
	const mockRepo = mockProductRepository();

	const service = new ProductService(mockRepo);

	beforeEach(() => {
		mockRepo.reset();
	});

	describe("create", () => {
		const mockProductWithFile = generateMockInsertProductWithMulterImage();
		const mockSelectProduct = generateMockSelectProduct();

		// Convert File image to string URL for ProductService
		const mockInsertProduct = {
			...mockProductWithFile,
			image: mockSelectProduct.image, // Use string URL instead of File
		};

		const expectedResult = {
			...mockInsertProduct,
			id: mockSelectProduct.id,
			createdAt: mockSelectProduct.createdAt,
			image: mockSelectProduct.image,
			numReviews: mockSelectProduct.numReviews,
			rating: mockSelectProduct.rating,
			updatedAt: mockSelectProduct.updatedAt,
		};

		test("Should return product object when 'repo.create' is called once with product data", async () => {
			// Arrange
			mockRepo.create.mock.mockImplementationOnce(() =>
				Promise.resolve({ data: expectedResult, success: true }),
			);

			// Act
			const result = await service.create(mockInsertProduct);

			// Assert
			assert.ok(result.success);
			assert.deepEqual(result.data, expectedResult);

			assert.strictEqual(mockRepo.create.mock.callCount(), 1);
			assert.deepStrictEqual(
				mockRepo.create.mock.calls[0].arguments[0],
				mockInsertProduct,
			);
		});

		test("Should return validation error if 'product.userId' is invalid objectId", async () => {
			// Arrange
			const mockProductWithFile = generateMockInsertProductWithMulterImage();
			const invalidProduct = {
				...mockProductWithFile,
				image: "https://example.com/image.jpg", // Use string URL
				userId: "invalid-user-id",
			};

			// Act
			const result = await service.create(invalidProduct);

			// Assert
			assert.strictEqual(result.success, false);
			assert.ok(result.error instanceof ValidationError);
		});

		test("Should return validation error if 'product.name' is empty", async () => {
			// Arrange
			const mockProductWithFile = generateMockInsertProductWithMulterImage();
			const invalidProduct = {
				...mockProductWithFile,
				image: "https://example.com/image.jpg", // Use string URL
				name: "",
			};

			// Act
			const result = await service.create(invalidProduct);

			// Assert
			assert.strictEqual(result.success, false);
			assert.ok(result.error instanceof ValidationError);
		});

		test("Should return validation error if 'product.name' is not a string", async () => {
			// Arrange
			const mockProductWithFile = generateMockInsertProductWithMulterImage();
			const invalidProduct = {
				...mockProductWithFile,
				image: "https://example.com/image.jpg", // Use string URL
				name: 123 as unknown as string,
			};

			// Act
			const result = await service.create(invalidProduct);

			// Assert
			assert.strictEqual(result.success, false);
			assert.ok(result.error instanceof ValidationError);
		});

		test("Should return validation error if 'product.brand' is empty", async () => {
			// Arrange
			const mockProductWithFile = generateMockInsertProductWithMulterImage();
			const invalidProduct = {
				...mockProductWithFile,
				image: "https://example.com/image.jpg", // Use string URL
				brand: "",
			};

			// Act
			const result = await service.create(invalidProduct);

			// Assert
			assert.strictEqual(result.success, false);
			assert.ok(result.error instanceof ValidationError);
		});

		test("Should return validation error if 'product.brand' is not a string", async () => {
			// Arrange
			const mockProductWithFile = generateMockInsertProductWithMulterImage();
			const invalidProduct = {
				...mockProductWithFile,
				image: "https://example.com/image.jpg", // Use string URL
				brand: 123 as unknown as string,
			};

			// Act
			const result = await service.create(invalidProduct);

			// Assert
			assert.strictEqual(result.success, false);
			assert.ok(result.error instanceof ValidationError);
		});

		test("Should return validation error if 'product.category' is empty", async () => {
			// Arrange
			const mockProductWithFile = generateMockInsertProductWithMulterImage();
			const invalidProduct = {
				...mockProductWithFile,
				image: "https://example.com/image.jpg", // Use string URL
				category: "",
			};

			// Act
			const result = await service.create(invalidProduct);

			// Assert
			assert.strictEqual(result.success, false);
			assert.ok(result.error instanceof ValidationError);
		});

		test("Should return validation error if 'product.category' is not a string", async () => {
			// Arrange
			const mockProductWithFile = generateMockInsertProductWithMulterImage();
			const invalidProduct = {
				...mockProductWithFile,
				image: "https://example.com/image.jpg", // Use string URL
				category: 123 as unknown as string,
			};

			// Act
			const result = await service.create(invalidProduct);

			// Assert
			assert.strictEqual(result.success, false);
			assert.ok(result.error instanceof ValidationError);
		});

		test("Should return validation error if 'product.description' is empty", async () => {
			// Arrange
			const mockProductWithFile = generateMockInsertProductWithMulterImage();
			const invalidProduct = {
				...mockProductWithFile,
				image: "https://example.com/image.jpg", // Use string URL
				description: "",
			};

			// Act
			const result = await service.create(invalidProduct);

			// Assert
			assert.strictEqual(result.success, false);
			assert.ok(result.error instanceof ValidationError);
		});

		test("Should return validation error if 'product.description' is not a string", async () => {
			// Arrange
			const mockProductWithFile = generateMockInsertProductWithMulterImage();
			const invalidProduct = {
				...mockProductWithFile,
				image: "https://example.com/image.jpg", // Use string URL
				description: 123 as unknown as string,
			};

			// Act
			const result = await service.create(invalidProduct);

			// Assert
			assert.strictEqual(result.success, false);
			assert.ok(result.error instanceof ValidationError);
		});

		test("Should return validation error if 'product.price' is not a number", async () => {
			// Arrange
			const mockProductWithFile = generateMockInsertProductWithMulterImage();
			const invalidProduct = {
				...mockProductWithFile,
				image: "https://example.com/image.jpg", // Use string URL
				price: "invalid-price" as unknown as number,
			};

			// Act
			const result = await service.create(invalidProduct);

			// Assert
			assert.strictEqual(result.success, false);
			assert.ok(result.error instanceof ValidationError);
		});

		test("Should return validation error if 'product.countInStock' is not a number", async () => {
			// Arrange
			const mockProductWithFile = generateMockInsertProductWithMulterImage();
			const invalidProduct = {
				...mockProductWithFile,
				image: "https://example.com/image.jpg", // Use string URL
				countInStock: "invalid-stock" as unknown as number,
			};

			// Act
			const result = await service.create(invalidProduct);

			// Assert
			assert.strictEqual(result.success, false);
			assert.ok(result.error instanceof ValidationError);
		});
	});

	describe("getAll", () => {
		const mockProducts = generateMockSelectProducts({ count: 4 });
		const mockPaginatedResponse = {
			items: mockProducts,
			meta: {
				currentPage: 1,
				hasNextPage: false,
				hasPreviousPage: false,
				pageSize: 10,
				totalItems: 4,
				totalPages: 1,
			},
		};

		test("Should return paginated response when 'repo.getAll' is called with valid parameters", async () => {
			// Arrange
			mockRepo.getAll.mock.mockImplementationOnce(() =>
				Promise.resolve({ data: mockPaginatedResponse, success: true }),
			);

			// Act
			const result = await service.getAll({
				pageNumber: "1",
				pageSize: "10",
			});

			// Assert
			assert.ok(result.success);
			assert.ok(result.data);
			assert.ok(result.data.meta);
			assert.ok(Array.isArray(result.data.items));
			assert.strictEqual(result.data.items.length, mockProducts.length);
			assert.deepStrictEqual(result.data.items, mockProducts);
		});

		test("Should call 'repo.getAll' with correct pagination parameters", async () => {
			// Arrange
			const pageNumber = "2";
			const pageSize = "5";
			mockRepo.getAll.mock.mockImplementationOnce(() =>
				Promise.resolve({ data: mockPaginatedResponse, success: true }),
			);

			// Act
			await service.getAll({
				pageNumber,
				pageSize,
			});

			// Assert
			assert.strictEqual(mockRepo.getAll.mock.callCount(), 1);
			assert.strictEqual(
				mockRepo.getAll.mock.calls[0].arguments[0].pageNumber,
				Number(pageNumber),
			);
			assert.strictEqual(
				mockRepo.getAll.mock.calls[0].arguments[0].pageSize,
				Number(pageSize),
			);
		});

		test("Should call 'repo.getAll' with filters when keyword is provided", async () => {
			// Arrange
			const keyword = "test";
			mockRepo.getAll.mock.mockImplementationOnce(() =>
				Promise.resolve({ data: mockPaginatedResponse, success: true }),
			);

			// Act
			await service.getAll({
				pageNumber: "1",
				pageSize: "10",
				filters: { keyword },
			});

			// Assert
			assert.strictEqual(mockRepo.getAll.mock.callCount(), 1);
			assert.deepStrictEqual(
				mockRepo.getAll.mock.calls[0].arguments[0].filters,
				{ keyword },
			);
		});

		test("Should call 'repo.getAll' with select projection", async () => {
			// Arrange
			mockRepo.getAll.mock.mockImplementationOnce(() =>
				Promise.resolve({ data: mockPaginatedResponse, success: true }),
			);

			// Act
			await service.getAll({
				pageNumber: "1",
				pageSize: "10",
			});

			// Assert
			assert.strictEqual(mockRepo.getAll.mock.callCount(), 1);
			assert.deepStrictEqual(
				mockRepo.getAll.mock.calls[0].arguments[0].select,
				{
					id: true,
					brand: true,
					category: true,
					image: true,
					name: true,
					price: true,
					rating: true,
					countInStock: true,
				},
			);
		});

		test("Should return paginated response with empty items", async () => {
			// Arrange
			const emptyPaginatedResponse = {
				items: [],
				meta: {
					currentPage: 1,
					hasNextPage: false,
					hasPreviousPage: false,
					pageSize: 10,
					totalItems: 0,
					totalPages: 0,
				},
			};
			mockRepo.getAll.mock.mockImplementationOnce(() =>
				Promise.resolve({ data: emptyPaginatedResponse, success: true }),
			);

			// Act
			const result = await service.getAll({
				pageNumber: "1",
				pageSize: "10",
			});

			// Assert
			assert.ok(result.success);
			assert.strictEqual(result.data.items.length, 0);
			assert.strictEqual(result.data.meta.totalItems, 0);
		});

		test("Should return validation error when 'pageNumber' is invalid", async () => {
			// Act
			const result = await service.getAll({
				pageNumber: "invalid",
				pageSize: "10",
			});

			// Assert
			assert.strictEqual(result.success, false);
			assert.ok(result.error instanceof ValidationError);
		});

		test("Should return validation error when 'pageSize' is invalid", async () => {
			// Act
			const result = await service.getAll({
				pageNumber: "1",
				pageSize: "invalid",
			});

			// Assert
			assert.strictEqual(result.success, false);
			assert.ok(result.error instanceof ValidationError);
		});

		test("Should return validation error when 'pageNumber' is zero", async () => {
			// Act
			const result = await service.getAll({
				pageNumber: "0",
				pageSize: "10",
			});

			// Assert
			assert.strictEqual(result.success, false);
			assert.ok(result.error instanceof ValidationError);
		});

		test("Should return validation error when 'pageNumber' is negative", async () => {
			// Act
			const result = await service.getAll({
				pageNumber: "-1",
				pageSize: "10",
			});

			// Assert
			assert.strictEqual(result.success, false);
			assert.ok(result.error instanceof ValidationError);
		});

		test("Should return validation error when 'pageSize' is zero", async () => {
			// Act
			const result = await service.getAll({
				pageNumber: "1",
				pageSize: "0",
			});

			// Assert
			assert.strictEqual(result.success, false);
			assert.ok(result.error instanceof ValidationError);
		});

		test("Should return validation error when 'pageSize' is negative", async () => {
			// Act
			const result = await service.getAll({
				pageNumber: "1",
				pageSize: "-1",
			});

			// Assert
			assert.strictEqual(result.success, false);
			assert.ok(result.error instanceof ValidationError);
		});

		test("Should return repository error when 'repo.getAll' fails", async () => {
			// Arrange
			const repositoryError = new DatabaseBaseError("Repository error");
			mockRepo.getAll.mock.mockImplementationOnce(() =>
				Promise.resolve({ error: repositoryError, success: false }),
			);

			// Act
			const result = await service.getAll({
				pageNumber: "1",
				pageSize: "10",
			});

			// Assert
			assert.strictEqual(result.success, false);
			assert.strictEqual(result.error, repositoryError);
		});
	});

	describe("getTopRated", () => {
		const expectedResult = generateMockSelectProducts({ count: 3 });

		test("Should return array of products when 'repo.getTopRated' is called once with no args", async () => {
			// Arrange
			mockRepo.getTopRated.mock.mockImplementationOnce(() =>
				Promise.resolve({ data: expectedResult, success: true }),
			);

			// Act
			const result = await service.getTopRated();

			// Assert
			assert.ok(result.success);
			assert.strictEqual(result.data.length, expectedResult.length);
			assert.deepStrictEqual(result.data, expectedResult);

			assert.strictEqual(mockRepo.getTopRated.mock.callCount(), 1);
			assert.deepStrictEqual(
				mockRepo.getTopRated.mock.calls[0].arguments[0].limit,
				3,
			);
		});
	});

	describe("getById", () => {
		const expectedResult = generateMockSelectProduct();
		const productId = expectedResult.id;

		test("Should return product object when 'repo.getById' is called once with 'productId'", async () => {
			// Arrange
			mockRepo.getById.mock.mockImplementationOnce(() =>
				Promise.resolve({ data: expectedResult, success: true }),
			);

			// Act
			const result = await service.getById({
				productId,
			});

			// Assert
			assert.ok(result.success);
			assert.deepStrictEqual(result.data, expectedResult);

			assert.strictEqual(mockRepo.getById.mock.callCount(), 1);
			assert.deepStrictEqual(
				mockRepo.getById.mock.calls[0].arguments[0].productId,
				productId,
			);
		});

		test("Should return not found error if 'repo.getById' returns 'null'", async () => {
			// Arrange
			mockRepo.getById.mock.mockImplementationOnce(() =>
				Promise.resolve({ data: null, success: true }),
			);

			// Act
			const result = await service.getById({
				productId,
			});

			// Assert
			assert.strictEqual(result.success, false);
			assert.ok(result.error instanceof NotFoundError);
		});

		test("Should return validation error if 'productId' is invalid ObjectId", async () => {
			// Arrange
			const invalidProductId = "invalid-product-id";

			// Act
			const result = await service.getById({ productId: invalidProductId });

			// Assert
			assert.strictEqual(result.success, false);
			assert.ok(result.error instanceof ValidationError);
		});
	});

	describe("update", () => {
		const mockProduct = generateMockSelectProduct();
		const productId = mockProduct.id;

		test("Should return product object when 'repo.update' is called once with 'productId' and 'data'", async () => {
			// Arrange
			const mockUpdateData = { name: "UPDATED NAME" };
			const expectedResult = { ...mockProduct, ...mockUpdateData };

			mockRepo.update.mock.mockImplementationOnce(() =>
				Promise.resolve({ data: expectedResult, success: true }),
			);

			// Act
			const result = await service.update({
				data: mockUpdateData,
				productId,
			});

			// Assert
			assert.ok(result.success);
			assert.deepStrictEqual(result.data, expectedResult);

			assert.strictEqual(mockRepo.update.mock.callCount(), 1);

			assert.deepStrictEqual(
				mockRepo.update.mock.calls[0].arguments[0].productId,
				productId,
			);
			assert.deepStrictEqual(
				mockRepo.update.mock.calls[0].arguments[0].data,
				mockUpdateData,
			);

			// Ensure that update didn't require fetching product first
			assert.strictEqual(mockRepo.getById.mock.callCount(), 0);
		});

		test("Should return not found error if 'repo.update' returns 'null'", async () => {
			// Arrange
			const mockUpdateData = { name: "UPDATED NAME" };

			mockRepo.update.mock.mockImplementationOnce(() =>
				Promise.resolve({ data: null, success: true }),
			);

			// Act
			const result = await service.update({
				data: mockUpdateData,
				productId,
			});

			// Assert
			assert.strictEqual(result.success, false);
			assert.ok(result.error instanceof NotFoundError);
		});

		test("Should return validation error if 'productId' is invalid ObjectId", async () => {
			// Arrange
			const invalidProductId = "invalid-product-id";
			const updateData = { name: "UPDATED NAME" };

			// Act
			const result = await service.update({
				data: updateData,
				productId: invalidProductId,
			});

			// Assert
			assert.strictEqual(result.success, false);
			assert.ok(result.error instanceof ValidationError);
		});
	});

	describe("delete", () => {
		const expectedResult = generateMockSelectProduct();
		const productId = expectedResult.id;

		test("Should return 'undefined' when 'repo.delete' is called once with 'productId'", async () => {
			// Arrange
			mockRepo.delete.mock.mockImplementationOnce(() =>
				Promise.resolve({ data: expectedResult, success: true }),
			);

			// Act
			const result = await service.delete({
				productId,
			});

			// Assert
			assert.ok(result.success);
			assert.strictEqual(result.data, undefined);

			assert.strictEqual(mockRepo.delete.mock.callCount(), 1);
			assert.deepStrictEqual(
				mockRepo.delete.mock.calls[0].arguments[0].productId,
				productId,
			);
		});

		test("Should return not found error if 'repo.delete' returns 'null'", async () => {
			// Arrange
			mockRepo.delete.mock.mockImplementationOnce(() =>
				Promise.resolve({ data: null, success: true }),
			);

			// Act
			const result = await service.delete({
				productId,
			});

			// Assert
			assert.strictEqual(result.success, false);
			assert.ok(result.error instanceof NotFoundError);
		});

		test("Should return validation error if 'productId' is invalid ObjectId", async () => {
			// Arrange
			const invalidProductId = "invalid-product-id";

			// Act
			const result = await service.delete({ productId: invalidProductId });

			// Assert
			assert.strictEqual(result.success, false);
			assert.ok(result.error instanceof ValidationError);
		});
	});
});
