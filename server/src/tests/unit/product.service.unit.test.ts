import type { Types } from "mongoose";

import assert from "node:assert/strict";
import test, { beforeEach, describe, suite } from "node:test";

import { NotFoundError, ValidationError } from "../../errors/index.js";
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
			mockStorage.upload.mock.mockImplementationOnce(() =>
				Promise.resolve({ data: expectedResult.image, success: true }),
			);

			mockRepo.create.mock.mockImplementationOnce(() =>
				Promise.resolve({ data: expectedResult, success: true }),
			);

			const result = await service.create(mockInsertProduct);

			assert.ok(result);
			assert.deepEqual(result, expectedResult);

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
			assert.ok(result);
			assert.strictEqual(result.image, expectedResult.image);

			assert.strictEqual(mockStorage.upload.mock.callCount(), 1);
			assert.deepStrictEqual(mockStorage.upload.mock.calls[0].arguments[0], {
				file: mockInsertProduct.image,
			});
		});

		test("Should throw generic 'Error' if 'storage.upload' rejects", async () => {
			const mockError = new Error("Upload failed");

			mockStorage.upload.mock.mockImplementationOnce(() =>
				Promise.reject(mockError),
			);

			await assert.rejects(
				() => service.create(mockInsertProduct),
				(error: Error) => {
					assert.ok(error instanceof Error);
					assert.strictEqual(error.message, mockError.message);
					return true;
				},
			);
		});

		test("Should throw 'ValidationError' if 'product.user' is invalid objectId", async () => {
			// Arrange
			const mockInsertProduct = generateMockInsertProductWithMulterImage();
			mockInsertProduct.user = "invalid-user-id" as unknown as Types.ObjectId;

			// Act & Assert
			await assert.rejects(
				async () => await service.create(mockInsertProduct),
				ValidationError,
			);
		});

		test("Should throw 'ValidationError' if 'product.name' is empty", async () => {
			// Arrange
			const mockInsertProduct = generateMockInsertProductWithMulterImage();
			mockInsertProduct.name = "";

			// Act & Assert
			await assert.rejects(
				async () => await service.create(mockInsertProduct),
				ValidationError,
			);
		});

		test("Should throw 'ValidationError' if 'product.name' is not a string", async () => {
			// Arrange
			const mockInsertProduct = generateMockInsertProductWithMulterImage();
			mockInsertProduct.name = 123 as unknown as string;

			// Act & Assert
			await assert.rejects(
				async () => await service.create(mockInsertProduct),
				ValidationError,
			);
		});

		test("Should throw 'ValidationError' if 'product.brand' is empty", async () => {
			// Arrange
			const mockInsertProduct = generateMockInsertProductWithMulterImage();
			mockInsertProduct.brand = "";

			// Act & Assert
			await assert.rejects(
				async () => await service.create(mockInsertProduct),
				ValidationError,
			);
		});

		test("Should throw 'ValidationError' if 'product.brand' is not a string", async () => {
			// Arrange
			const mockInsertProduct = generateMockInsertProductWithMulterImage();
			mockInsertProduct.brand = 123 as unknown as string;

			// Act & Assert
			await assert.rejects(
				async () => await service.create(mockInsertProduct),
				ValidationError,
			);
		});

		test("Should throw 'ValidationError' if 'product.category' is empty", async () => {
			// Arrange
			const mockInsertProduct = generateMockInsertProductWithMulterImage();
			mockInsertProduct.category = "";

			await assert.rejects(
				async () => await service.create(mockInsertProduct),

				ValidationError,
			);
		});

		test("Should throw 'ValidationError' if 'product.category' is not a string", async () => {
			// Arrange
			const mockInsertProduct = generateMockInsertProductWithMulterImage();
			mockInsertProduct.category = 123 as unknown as string;

			// Act & Assert
			await assert.rejects(
				async () => await service.create(mockInsertProduct),
				ValidationError,
			);
		});

		test("Should throw 'ValidationError' if 'product.description' is empty", async () => {
			// Arrange
			const mockInsertProduct = generateMockInsertProductWithMulterImage();
			mockInsertProduct.description = "";

			// Act & Assert
			await assert.rejects(
				async () => await service.create(mockInsertProduct),
				ValidationError,
			);
		});

		test("Should throw 'ValidationError' if 'product.description' is not a string", async () => {
			// Arrange
			const mockInsertProduct = generateMockInsertProductWithMulterImage();
			mockInsertProduct.description = 123 as unknown as string;

			// Act & Assert
			await assert.rejects(
				async () => await service.create(mockInsertProduct),
				ValidationError,
			);
		});

		test("Should throw 'ValidationError' if 'product.price' is not a number", async () => {
			// Arrange
			const mockInsertProduct = generateMockInsertProductWithMulterImage();
			mockInsertProduct.price = "invalid-price" as unknown as number;

			// Act & Assert
			await assert.rejects(
				async () => await service.create(mockInsertProduct),
				ValidationError,
			);
		});

		test("Should throw 'ValidationError' if 'product.countInStock' is not a number", async () => {
			// Arrange
			const mockInsertProduct = generateMockInsertProductWithMulterImage();
			mockInsertProduct.countInStock = "invalid-stock" as unknown as number;

			// Act & Assert
			await assert.rejects(
				async () => await service.create(mockInsertProduct),
				ValidationError,
			);
		});
	});

	describe("getAll", () => {
		const mockCount = 4;
		const expectedResult = generateMockSelectProducts({ count: 4 });

		function createRegexQuery(keyword: string) {
			return { name: { $options: "i", $regex: keyword } };
		}

		test("Should return array of products when both 'repo.count' and 'repo.getAll' are called once with no args", async () => {
			// Arrange
			const currentPage = "1";
			const keyword = "";

			mockRepo.count.mock.mockImplementationOnce(() =>
				Promise.resolve({ data: mockCount, success: true }),
			);

			mockRepo.getAll.mock.mockImplementationOnce(() =>
				Promise.resolve({ data: expectedResult, success: true }),
			);

			// Act
			const result = await service.getAll({ currentPage, keyword });

			// Assert
			assert.ok(result);
			assert.strictEqual(result.products.length, expectedResult.length);
			assert.deepStrictEqual(result.products, expectedResult);

			assert.strictEqual(mockRepo.count.mock.callCount(), 1);
			assert.deepStrictEqual(mockRepo.count.mock.calls[0].arguments[0], {});

			assert.strictEqual(mockRepo.getAll.mock.callCount(), 1);
			assert.deepStrictEqual(mockRepo.getAll.mock.calls[0].arguments[0], {
				currentPage: Number(currentPage),
				numberOfProductsPerPage: 10,
				query: {},
			});
		});

		test("Should return array of products when both 'repo.count' and 'repo.getAll' are called once with 'keyword''", async () => {
			// Arrange
			const currentPage = "1";
			const keyword = "test";

			mockRepo.count.mock.mockImplementationOnce(() =>
				Promise.resolve({ data: mockCount, success: true }),
			);

			mockRepo.getAll.mock.mockImplementationOnce(() =>
				Promise.resolve({ data: expectedResult, success: true }),
			);

			// Act
			const result = await service.getAll({ currentPage, keyword });

			// Assert
			assert.ok(result);
			assert.strictEqual(result.products.length, expectedResult.length);
			assert.deepStrictEqual(result.products, expectedResult);

			assert.strictEqual(mockRepo.count.mock.callCount(), 1);
			assert.deepStrictEqual(
				mockRepo.count.mock.calls[0].arguments[0],
				createRegexQuery(keyword),
			);

			assert.strictEqual(mockRepo.getAll.mock.callCount(), 1);
			assert.deepStrictEqual(mockRepo.getAll.mock.calls[0].arguments[0], {
				currentPage: Number(currentPage),
				numberOfProductsPerPage: 10,
				query: createRegexQuery(keyword),
			});
		});

		test("Should return array of products when both 'repo.count' and 'repo.getAll' are called once with 'currentPage'", async () => {
			// Arrange
			const currentPage = "2";
			const keyword = "";

			mockRepo.count.mock.mockImplementationOnce(() =>
				Promise.resolve({ data: mockCount, success: true }),
			);
			mockRepo.getAll.mock.mockImplementationOnce(() =>
				Promise.resolve({ data: expectedResult, success: true }),
			);

			// Act
			const result = await service.getAll({ currentPage, keyword });

			// Assert
			assert.ok(result);
			assert.strictEqual(result.products.length, expectedResult.length);
			assert.deepStrictEqual(result.products, expectedResult);

			assert.strictEqual(mockRepo.count.mock.callCount(), 1);
			assert.deepStrictEqual(mockRepo.count.mock.calls[0].arguments[0], {});

			assert.strictEqual(mockRepo.getAll.mock.callCount(), 1);
			assert.deepStrictEqual(mockRepo.getAll.mock.calls[0].arguments[0], {
				currentPage: Number(currentPage),
				numberOfProductsPerPage: 10,
				query: {},
			});
		});

		test("Should throw 'ValidationError' if 'currentPage' is not a number", async () => {
			// Arrange
			const currentPage = "invalid-number";
			const keyword = "";

			// Act & Assert
			await assert.rejects(
				async () => await service.getAll({ currentPage, keyword }),
				ValidationError,
			);
		});

		test("Should throw 'ValidationError' if 'currentPage' is '0'", async () => {
			// Arrange
			const currentPage = "0";
			const keyword = "";

			// Act & Assert
			await assert.rejects(
				async () => await service.getAll({ currentPage, keyword }),
				ValidationError,
			);
		});

		test("Should throw 'ValidationError' if 'currentPage' is a negative number", async () => {
			// Arrange
			const currentPage = "-1";
			const keyword = "";

			// Act & Assert
			await assert.rejects(
				async () => await service.getAll({ currentPage, keyword }),
				ValidationError,
			);
		});

		test("Should throw 'ValidationError' if 'currentPage' is non-integer number", async () => {
			// Arrange
			const currentPage = "1.5";
			const keyword = "";

			// Act & Assert
			await assert.rejects(
				async () => await service.getAll({ currentPage, keyword }),
				ValidationError,
			);
		});
	});

	describe("getTopRated", () => {
		const expectedResult = generateMockSelectProducts({ count: 3 });

		test("Should return array of products when 'repo.getTopRated' is called once with no args", async () => {
			mockRepo.getTopRated.mock.mockImplementationOnce(() =>
				Promise.resolve({ data: expectedResult, success: true }),
			);

			const result = await service.getTopRated();

			assert.ok(result);
			assert.strictEqual(result.length, expectedResult.length);
			assert.deepStrictEqual(result, expectedResult);

			assert.strictEqual(mockRepo.getTopRated.mock.callCount(), 1);
			assert.deepStrictEqual(mockRepo.getTopRated.mock.calls[0].arguments[0], {
				limit: 3,
			});
		});
	});

	describe("getById", () => {
		const expectedResult = generateMockSelectProduct();
		const productId = expectedResult._id;

		test("Should return product object when 'repo.getById' is called once with 'productId'", async () => {
			mockRepo.getById.mock.mockImplementationOnce(() =>
				Promise.resolve({ data: expectedResult, success: true }),
			);

			const result = await service.getById({
				productId: productId.toString(),
			});

			assert.ok(result);
			assert.deepStrictEqual(result, expectedResult);

			assert.strictEqual(mockRepo.getById.mock.callCount(), 1);
			assert.deepStrictEqual(mockRepo.getById.mock.calls[0].arguments[0], {
				productId,
			});
		});

		test("Should throw 'NotFoundError' if 'repo.getById' returns 'null'", async () => {
			mockRepo.getById.mock.mockImplementationOnce(() =>
				Promise.resolve({ data: null, success: true }),
			);

			await assert.rejects(
				() => service.getById({ productId: productId.toString() }),
				(error: Error) => {
					assert.ok(error instanceof NotFoundError);
					assert.strictEqual(error.message, "Product not found");
					assert.strictEqual(error.statusCode, 404);
					return true;
				},
			);
		});

		test("Should throw 'ValidationError' if 'productId' is invalid ObjectId", async () => {
			// Arrange
			const invalidProductId = "invalid-product-id";

			// Act & Assert
			await assert.rejects(
				async () => await service.getById({ productId: invalidProductId }),
				ValidationError,
			);
		});
	});

	describe("update", () => {
		const mockProduct = generateMockSelectProduct();
		const productId = mockProduct._id;

		test("Should return product object when 'repo.update' is called once with 'productId' and 'data'", async () => {
			const mockUpdateData = { name: "UPDATED NAME" };
			const expectedResult = { ...mockProduct, ...mockUpdateData };

			mockRepo.update.mock.mockImplementationOnce(() =>
				Promise.resolve({ data: expectedResult, success: true }),
			);

			const result = await service.update({
				data: mockUpdateData,
				productId: productId.toString(),
			});

			assert.ok(result);
			assert.deepStrictEqual(result, expectedResult);

			assert.strictEqual(mockRepo.update.mock.callCount(), 1);

			assert.deepStrictEqual(mockRepo.update.mock.calls[0].arguments[0], {
				data: mockUpdateData,
				productId,
			});

			// Ensure that 'repo.getById' wasn't called
			assert.strictEqual(mockRepo.getById.mock.callCount(), 0);
		});

		test("Should return product object when 'repo.getById' is called once with 'productId', and 'storage.replace' is called once with 'url' and 'file'", async () => {
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

			const result = await service.update({
				data: mockUpdateData,
				productId: productId.toString(),
			});

			assert.ok(result);
			assert.deepStrictEqual(result, mockProduct);

			assert.strictEqual(mockRepo.getById.mock.callCount(), 1);
			assert.deepStrictEqual(mockRepo.getById.mock.calls[0].arguments[0], {
				productId,
			});

			assert.strictEqual(mockStorage.replace.mock.callCount(), 1);
			assert.deepStrictEqual(mockStorage.replace.mock.calls[0].arguments[0], {
				file: mockUpdateData.image,
				url: mockProduct.image,
			});

			assert.strictEqual(mockRepo.update.mock.callCount(), 1);
			assert.deepStrictEqual(mockRepo.update.mock.calls[0].arguments[0], {
				data: { image: mockProduct.image },
				productId,
			});
		});

		test("Should throw 'NotFoundError' if 'repo.update' returns 'null'", async () => {
			const mockUpdateData = { name: "UPDATED NAME" };

			mockRepo.update.mock.mockImplementationOnce(() =>
				Promise.resolve({ data: null, success: true }),
			);

			await assert.rejects(
				() =>
					service.update({
						data: mockUpdateData,
						productId: productId.toString(),
					}),
				(error: Error) => {
					assert.ok(error instanceof NotFoundError);
					assert.strictEqual(error.message, "Product not found");
					assert.strictEqual(error.statusCode, 404);
					return true;
				},
			);
		});

		test("Should throw 'ValidationError' if 'productId' is invalid ObjectId", async () => {
			// Arrange
			const invalidProductId = "invalid-product-id";
			const updateData = { name: "UPDATED NAME" };

			// Act & Assert
			await assert.rejects(
				async () =>
					await service.update({
						data: updateData,
						productId: invalidProductId,
					}),
				ValidationError,
			);
		});
	});

	describe("delete", () => {
		const expectedResult = generateMockSelectProduct();
		const productId = expectedResult._id;

		test("Should return 'undefined' when 'repo.delete' is called once with 'productId'", async () => {
			mockRepo.delete.mock.mockImplementationOnce(() =>
				Promise.resolve({ data: expectedResult, success: true }),
			);

			const result = await service.delete({
				productId: productId.toString(),
			});

			assert.strictEqual(result, undefined);

			assert.strictEqual(mockRepo.delete.mock.callCount(), 1);
			assert.deepStrictEqual(mockRepo.delete.mock.calls[0].arguments[0], {
				productId,
			});
		});

		test("Should throw 'NotFoundError' if 'repo.delete' returns 'null'", async () => {
			mockRepo.delete.mock.mockImplementationOnce(() =>
				Promise.resolve({ data: null, success: true }),
			);

			await assert.rejects(
				async () => await service.delete({ productId: productId.toString() }),
				(error: Error) => {
					assert.ok(error instanceof NotFoundError);
					assert.strictEqual(error.message, "Product not found");
					assert.strictEqual(error.statusCode, 404);
					return true;
				},
			);
		});

		test("Should throw 'ValidationError' if 'productId' is invalid ObjectId", async () => {
			// Arrange
			const invalidProductId = "invalid-product-id";

			// Act & Assert
			await assert.rejects(
				async () => await service.delete({ productId: invalidProductId }),
				ValidationError,
			);
		});
	});
});
