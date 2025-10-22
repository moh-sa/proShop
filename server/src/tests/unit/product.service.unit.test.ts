import type { Types } from "mongoose";

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
	mockImageStorage,
	mockMulterImageFile,
	mockProductRepository,
} from "../mocks/index.js";

suite("Product Service 〖 Unit Tests 〗", () => {
	const mockRepo = mockProductRepository();
	const mockStorage = mockImageStorage();

	const service = new ProductService(mockRepo, mockStorage);

	beforeEach(() => {
		mockRepo.reset();
		mockStorage.reset();
	});

	describe("create", () => {
		const mockInsertProduct = generateMockInsertProductWithMulterImage();
		const mockSelectProduct = generateMockSelectProduct();
		const expectedResult = {
			...mockInsertProduct,
			_id: mockSelectProduct._id,
			createdAt: mockSelectProduct.createdAt,
			image: mockSelectProduct.image,
			numReviews: mockSelectProduct.numReviews,
			rating: mockSelectProduct.rating,
			updatedAt: mockSelectProduct.updatedAt,
		};

		test("Should return product object when 'repo.create' is called once with product data", async () => {
			// Arrange
			mockStorage.upload.mock.mockImplementationOnce(() =>
				Promise.resolve({ data: expectedResult.image, success: true }),
			);

			mockRepo.create.mock.mockImplementationOnce(() =>
				Promise.resolve({ data: expectedResult, success: true }),
			);

			// Act
			const result = await service.create(mockInsertProduct);

			// Assert
			assert.ok(result.success);
			assert.deepEqual(result.data, expectedResult);

			assert.strictEqual(mockRepo.create.mock.callCount(), 1);
			assert.deepStrictEqual(mockRepo.create.mock.calls[0].arguments[0], {
				...mockInsertProduct,
				image: expectedResult.image,
			});
		});

		test("Should return a string when 'storage.upload' is called once with 'data.file'", async () => {
			// Arrange
			mockStorage.upload.mock.mockImplementationOnce(() =>
				Promise.resolve({ data: expectedResult.image, success: true }),
			);

			mockRepo.create.mock.mockImplementationOnce(() =>
				Promise.resolve({ data: expectedResult, success: true }),
			);

			// Act
			const result = await service.create(mockInsertProduct);

			// Assert
			assert.ok(result.success);
			assert.strictEqual(result.data.image, expectedResult.image);

			assert.strictEqual(mockStorage.upload.mock.callCount(), 1);
			assert.deepStrictEqual(
				mockStorage.upload.mock.calls[0].arguments[0].file,
				mockInsertProduct.image,
			);
		});

		test("Should return validation error if 'product.user' is invalid objectId", async () => {
			// Arrange
			const mockInsertProduct = generateMockInsertProductWithMulterImage();
			mockInsertProduct.user = "invalid-user-id" as unknown as Types.ObjectId;

			// Act
			const result = await service.create(mockInsertProduct);

			// Assert
			assert.strictEqual(result.success, false);
			assert.ok(result.error instanceof ValidationError);
		});

		test("Should return validation error if 'product.name' is empty", async () => {
			// Arrange
			const mockInsertProduct = generateMockInsertProductWithMulterImage();
			mockInsertProduct.name = "";

			// Act
			const result = await service.create(mockInsertProduct);

			// Assert
			assert.strictEqual(result.success, false);
			assert.ok(result.error instanceof ValidationError);
		});

		test("Should return validation error if 'product.name' is not a string", async () => {
			// Arrange
			const mockInsertProduct = generateMockInsertProductWithMulterImage();
			mockInsertProduct.name = 123 as unknown as string;

			// Act
			const result = await service.create(mockInsertProduct);

			// Assert
			assert.strictEqual(result.success, false);
			assert.ok(result.error instanceof ValidationError);
		});

		test("Should return validation error if 'product.brand' is empty", async () => {
			// Arrange
			const mockInsertProduct = generateMockInsertProductWithMulterImage();
			mockInsertProduct.brand = "";

			// Act
			const result = await service.create(mockInsertProduct);

			// Assert
			assert.strictEqual(result.success, false);
			assert.ok(result.error instanceof ValidationError);
		});

		test("Should return validation error if 'product.brand' is not a string", async () => {
			// Arrange
			const mockInsertProduct = generateMockInsertProductWithMulterImage();
			mockInsertProduct.brand = 123 as unknown as string;

			// Act
			const result = await service.create(mockInsertProduct);

			// Assert
			assert.strictEqual(result.success, false);
			assert.ok(result.error instanceof ValidationError);
		});

		test("Should return validation error if 'product.category' is empty", async () => {
			// Arrange
			const mockInsertProduct = generateMockInsertProductWithMulterImage();
			mockInsertProduct.category = "";

			// Act
			const result = await service.create(mockInsertProduct);

			// Assert
			assert.strictEqual(result.success, false);
			assert.ok(result.error instanceof ValidationError);
		});

		test("Should return validation error if 'product.category' is not a string", async () => {
			// Arrange
			const mockInsertProduct = generateMockInsertProductWithMulterImage();
			mockInsertProduct.category = 123 as unknown as string;

			// Act
			const result = await service.create(mockInsertProduct);

			// Assert
			assert.strictEqual(result.success, false);
			assert.ok(result.error instanceof ValidationError);
		});

		test("Should return validation error if 'product.description' is empty", async () => {
			// Arrange
			const mockInsertProduct = generateMockInsertProductWithMulterImage();
			mockInsertProduct.description = "";

			// Act
			const result = await service.create(mockInsertProduct);

			// Assert
			assert.strictEqual(result.success, false);
			assert.ok(result.error instanceof ValidationError);
		});

		test("Should return validation error if 'product.description' is not a string", async () => {
			// Arrange
			const mockInsertProduct = generateMockInsertProductWithMulterImage();
			mockInsertProduct.description = 123 as unknown as string;

			// Act
			const result = await service.create(mockInsertProduct);

			// Assert
			assert.strictEqual(result.success, false);
			assert.ok(result.error instanceof ValidationError);
		});

		test("Should return validation error if 'product.price' is not a number", async () => {
			// Arrange
			const mockInsertProduct = generateMockInsertProductWithMulterImage();
			mockInsertProduct.price = "invalid-price" as unknown as number;

			// Act
			const result = await service.create(mockInsertProduct);

			// Assert
			assert.strictEqual(result.success, false);
			assert.ok(result.error instanceof ValidationError);
		});

		test("Should return validation error if 'product.countInStock' is not a number", async () => {
			// Arrange
			const mockInsertProduct = generateMockInsertProductWithMulterImage();
			mockInsertProduct.countInStock = "invalid-stock" as unknown as number;

			// Act
			const result = await service.create(mockInsertProduct);

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

		test("Should call 'repo.getAll' with search query when keyword is provided", async () => {
			// Arrange
			const keyword = "test";
			mockRepo.getAll.mock.mockImplementationOnce(() =>
				Promise.resolve({ data: mockPaginatedResponse, success: true }),
			);

			// Act
			await service.getAll({
				keyword,
				pageNumber: "1",
			});

			// Assert
			assert.strictEqual(mockRepo.getAll.mock.callCount(), 1);
			assert.deepStrictEqual(mockRepo.getAll.mock.calls[0].arguments[0].query, {
				$text: { $search: keyword },
			});
		});

		test("Should call 'repo.getAll' with pipeline projection", async () => {
			// Arrange
			mockRepo.getAll.mock.mockImplementationOnce(() =>
				Promise.resolve({ data: mockPaginatedResponse, success: true }),
			);

			// Act
			await service.getAll({
				pageNumber: "1",
			});

			// Assert
			assert.strictEqual(mockRepo.getAll.mock.callCount(), 1);
			assert.ok(mockRepo.getAll.mock.calls[0].arguments[0].pipeline);
			assert.strictEqual(
				mockRepo.getAll.mock.calls[0].arguments[0].pipeline.length,
				1,
			);
			assert.deepStrictEqual(
				mockRepo.getAll.mock.calls[0].arguments[0].pipeline[0],
				{
					$project: {
						_id: 1,
						brand: 1,
						category: 1,
						image: 1,
						name: 1,
						price: 1,
						rating: 1,
					},
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
			});

			// Assert
			assert.strictEqual(result.success, false);
			assert.ok(result.error instanceof ValidationError);
		});

		test("Should return validation error when 'pageNumber' is negative", async () => {
			// Act
			const result = await service.getAll({
				pageNumber: "-1",
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
		const productId = expectedResult._id;

		test("Should return product object when 'repo.getById' is called once with 'productId'", async () => {
			// Arrange
			mockRepo.getById.mock.mockImplementationOnce(() =>
				Promise.resolve({ data: expectedResult, success: true }),
			);

			// Act
			const result = await service.getById({
				productId: productId.toString(),
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
				productId: productId.toString(),
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
		const productId = mockProduct._id;

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
				productId: productId.toString(),
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

			// Ensure that 'repo.getById' wasn't called
			assert.strictEqual(mockRepo.getById.mock.callCount(), 0);
		});

		test("Should return product object when 'repo.getById' is called once with 'productId', and 'storage.replace' is called once with 'url' and 'file'", async () => {
			// Arrange
			const mockUpdateData = { image: mockMulterImageFile() };

			mockRepo.getById.mock.mockImplementationOnce(() =>
				Promise.resolve({ data: mockProduct, success: true }),
			);

			mockStorage.replace.mock.mockImplementationOnce(() =>
				Promise.resolve({ data: mockProduct.image, success: true }),
			);

			mockRepo.update.mock.mockImplementationOnce(() =>
				Promise.resolve({ data: mockProduct, success: true }),
			);

			// Act
			const result = await service.update({
				data: mockUpdateData,
				productId: productId.toString(),
			});

			// Assert
			assert.ok(result.success);
			assert.deepStrictEqual(result.data, mockProduct);

			assert.strictEqual(mockRepo.getById.mock.callCount(), 1);
			assert.deepStrictEqual(
				mockRepo.getById.mock.calls[0].arguments[0].productId,
				productId,
			);

			assert.strictEqual(mockStorage.replace.mock.callCount(), 1);
			assert.deepStrictEqual(
				mockStorage.replace.mock.calls[0].arguments[0].file,
				mockUpdateData.image,
			);
			assert.deepStrictEqual(
				mockStorage.replace.mock.calls[0].arguments[0].url,
				mockProduct.image,
			);

			assert.strictEqual(mockRepo.update.mock.callCount(), 1);
			assert.deepStrictEqual(
				mockRepo.update.mock.calls[0].arguments[0].productId,
				productId,
			);
			assert.deepStrictEqual(mockRepo.update.mock.calls[0].arguments[0].data, {
				image: mockProduct.image,
			});
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
				productId: productId.toString(),
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
		const productId = expectedResult._id;

		test("Should return 'undefined' when 'repo.delete' is called once with 'productId'", async () => {
			// Arrange
			mockRepo.delete.mock.mockImplementationOnce(() =>
				Promise.resolve({ data: expectedResult, success: true }),
			);

			mockStorage.delete.mock.mockImplementationOnce(() =>
				Promise.resolve({ data: undefined, success: true }),
			);

			// Act
			const result = await service.delete({
				productId: productId.toString(),
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
				productId: productId.toString(),
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
