import assert from "node:assert/strict";
import test, { beforeEach, describe, suite } from "node:test";

import { ValidationError } from "../../errors/index.js";
import { ProductManager } from "../../managers/product.manager.js";
import type { GetAllProductsManagerParams } from "../../types/index.js";
import {
	generateMockInsertProductWithMulterImage,
	generateMockSelectProduct,
	generateMockSelectProducts,
	mockImageStorage,
	mockProductService,
} from "../mocks/index.js";

suite("Product Manager 〖 Unit Tests 〗", () => {
	const mockProductSvc = mockProductService();
	const mockImageSvc = mockImageStorage();
	const manager = new ProductManager(mockProductSvc, mockImageSvc);

	beforeEach(() => {
		mockProductSvc.reset();
		mockImageSvc.reset();
	});

	describe("create", () => {
		const mockProductWithFile = generateMockInsertProductWithMulterImage();
		const mockSelectProduct = generateMockSelectProduct();
		const mockImageUrl = "https://cloudinary.com/image.jpg";

		test("should return success with product data when image upload and product creation succeed", async () => {
			// Arrange
			mockImageSvc.upload.mock.mockImplementationOnce(() =>
				Promise.resolve({ data: mockImageUrl, success: true }),
			);
			mockProductSvc.create.mock.mockImplementationOnce(() =>
				Promise.resolve({ data: mockSelectProduct, success: true }),
			);

			// Act
			const result = await manager.create(mockProductWithFile);

			// Assert
			assert.strictEqual(result.success, true);
			assert.deepStrictEqual(result.data, mockSelectProduct);

			assert.strictEqual(mockImageSvc.upload.mock.callCount(), 1);
			assert.deepStrictEqual(
				mockImageSvc.upload.mock.calls[0].arguments[0].file,
				mockProductWithFile.image,
			);

			assert.strictEqual(mockProductSvc.create.mock.callCount(), 1);
			assert.deepStrictEqual(mockProductSvc.create.mock.calls[0].arguments[0], {
				...mockProductWithFile,
				image: mockImageUrl,
			});
		});

		test("should return validation error when no image is provided", async () => {
			// Arrange
			const productWithoutImage = {
				...mockProductWithFile,
				image: undefined,
			};

			// Act
			// @ts-expect-error - test case
			const result = await manager.create(productWithoutImage);

			// Assert
			assert.strictEqual(result.success, false);
			assert.ok(result.error instanceof ValidationError);
			assert.ok(result.error.message.includes("image"));

			assert.strictEqual(mockImageSvc.upload.mock.callCount(), 0);
			assert.strictEqual(mockProductSvc.create.mock.callCount(), 0);
		});

		test("should return error when image upload fails", async () => {
			// Arrange
			const uploadError = new Error("Upload failed");
			mockImageSvc.upload.mock.mockImplementationOnce(() =>
				Promise.resolve({ error: uploadError, success: false }),
			);

			// Act
			const result = await manager.create(mockProductWithFile);

			// Assert
			assert.strictEqual(result.success, false);
			assert.strictEqual(result.error, uploadError);

			assert.strictEqual(mockImageSvc.upload.mock.callCount(), 1);
			assert.strictEqual(mockProductSvc.create.mock.callCount(), 0);
		});

		test("should return error when product service creation fails", async () => {
			// Arrange
			const createError = new Error("Database error");
			mockImageSvc.upload.mock.mockImplementationOnce(() =>
				Promise.resolve({ data: mockImageUrl, success: true }),
			);
			mockProductSvc.create.mock.mockImplementationOnce(() =>
				Promise.resolve({ error: createError, success: false }),
			);

			// Act
			const result = await manager.create(mockProductWithFile);

			// Assert
			assert.strictEqual(result.success, false);
			assert.strictEqual(result.error, createError);

			assert.strictEqual(mockImageSvc.upload.mock.callCount(), 1);
			assert.strictEqual(mockProductSvc.create.mock.callCount(), 1);
		});
	});

	describe("delete", () => {
		const mockProduct = generateMockSelectProduct();
		const productId = mockProduct.id;

		test("should return success when product and image are deleted successfully", async () => {
			// Arrange
			mockProductSvc.getById.mock.mockImplementationOnce(() =>
				Promise.resolve({ data: mockProduct, success: true }),
			);
			mockProductSvc.delete.mock.mockImplementationOnce(() =>
				Promise.resolve({ data: undefined, success: true }),
			);
			mockImageSvc.delete.mock.mockImplementationOnce(() =>
				Promise.resolve({ data: undefined, success: true }),
			);

			// Act
			const result = await manager.delete({ productId });

			// Assert
			assert.strictEqual(result.success, true);

			assert.strictEqual(mockProductSvc.getById.mock.callCount(), 1);
			assert.strictEqual(
				mockProductSvc.getById.mock.calls[0].arguments[0].productId,
				productId,
			);

			assert.strictEqual(mockProductSvc.delete.mock.callCount(), 1);
			assert.strictEqual(
				mockProductSvc.delete.mock.calls[0].arguments[0].productId,
				productId,
			);

			assert.strictEqual(mockImageSvc.delete.mock.callCount(), 1);
			assert.strictEqual(
				mockImageSvc.delete.mock.calls[0].arguments[0].url,
				mockProduct.image,
			);
		});

		test("should return error when product is not found", async () => {
			// Arrange
			const notFoundError = new Error("Product not found");
			mockProductSvc.getById.mock.mockImplementationOnce(() =>
				Promise.resolve({ error: notFoundError, success: false }),
			);

			// Act
			const result = await manager.delete({ productId });

			// Assert
			assert.strictEqual(result.success, false);
			assert.strictEqual(result.error, notFoundError);

			assert.strictEqual(mockProductSvc.getById.mock.callCount(), 1);
			assert.strictEqual(mockProductSvc.delete.mock.callCount(), 0);
			assert.strictEqual(mockImageSvc.delete.mock.callCount(), 0);
		});

		test("should return error when product service deletion fails", async () => {
			// Arrange
			const deleteError = new Error("Database error");
			mockProductSvc.getById.mock.mockImplementationOnce(() =>
				Promise.resolve({ data: mockProduct, success: true }),
			);
			mockProductSvc.delete.mock.mockImplementationOnce(() =>
				Promise.resolve({ error: deleteError, success: false }),
			);

			// Act
			const result = await manager.delete({ productId });

			// Assert
			assert.strictEqual(result.success, false);
			assert.strictEqual(result.error, deleteError);

			assert.strictEqual(mockProductSvc.getById.mock.callCount(), 1);
			assert.strictEqual(mockProductSvc.delete.mock.callCount(), 1);
			assert.strictEqual(mockImageSvc.delete.mock.callCount(), 0);
		});

		test("should return error when image deletion fails", async () => {
			// Arrange
			const imageDeleteError = new Error("Cloudinary error");
			mockProductSvc.getById.mock.mockImplementationOnce(() =>
				Promise.resolve({ data: mockProduct, success: true }),
			);
			mockProductSvc.delete.mock.mockImplementationOnce(() =>
				Promise.resolve({ data: undefined, success: true }),
			);
			mockImageSvc.delete.mock.mockImplementationOnce(() =>
				Promise.resolve({ error: imageDeleteError, success: false }),
			);

			// Act
			const result = await manager.delete({ productId });

			// Assert
			assert.strictEqual(result.success, false);
			assert.strictEqual(result.error, imageDeleteError);

			assert.strictEqual(mockProductSvc.getById.mock.callCount(), 1);
			assert.strictEqual(mockProductSvc.delete.mock.callCount(), 1);
			assert.strictEqual(mockImageSvc.delete.mock.callCount(), 1);
		});
	});

	describe("update", () => {
		const mockProduct = generateMockSelectProduct();
		const productId = mockProduct.id;
		const mockUpdatedProduct = { ...mockProduct, name: "Updated Product" };

		test("should return success when updating product without image", async () => {
			// Arrange
			const updateData = { name: "Updated Product" };
			mockProductSvc.update.mock.mockImplementationOnce(() =>
				Promise.resolve({ data: mockUpdatedProduct, success: true }),
			);

			// Act
			const result = await manager.update({ data: updateData, productId });

			// Assert
			assert.strictEqual(result.success, true);
			assert.deepStrictEqual(result.data, mockUpdatedProduct);

			assert.strictEqual(mockProductSvc.update.mock.callCount(), 1);
			assert.deepStrictEqual(
				mockProductSvc.update.mock.calls[0].arguments[0].data,
				updateData,
			);
			assert.strictEqual(
				mockProductSvc.update.mock.calls[0].arguments[0].productId,
				productId,
			);

			assert.strictEqual(mockProductSvc.getById.mock.callCount(), 0);
			assert.strictEqual(mockImageSvc.replace.mock.callCount(), 0);
		});

		test("should return success when updating product with image replacement", async () => {
			// Arrange
			const mockFile = generateMockInsertProductWithMulterImage().image;
			const newImageUrl = "https://cloudinary.com/new-image.jpg";
			const updateData = { image: mockFile, name: "Updated Product" };

			mockProductSvc.getById.mock.mockImplementationOnce(() =>
				Promise.resolve({ data: mockProduct, success: true }),
			);
			mockImageSvc.replace.mock.mockImplementationOnce(() =>
				Promise.resolve({ data: newImageUrl, success: true }),
			);
			mockProductSvc.update.mock.mockImplementationOnce(() =>
				Promise.resolve({
					data: { ...mockUpdatedProduct, image: newImageUrl },
					success: true,
				}),
			);

			// Act
			const result = await manager.update({ data: updateData, productId });

			// Assert
			assert.strictEqual(result.success, true);
			assert.strictEqual(result.data.image, newImageUrl);

			assert.strictEqual(mockProductSvc.getById.mock.callCount(), 1);
			assert.strictEqual(
				mockProductSvc.getById.mock.calls[0].arguments[0].productId,
				productId,
			);

			assert.strictEqual(mockImageSvc.replace.mock.callCount(), 1);
			assert.deepStrictEqual(
				mockImageSvc.replace.mock.calls[0].arguments[0].file,
				mockFile,
			);
			assert.strictEqual(
				mockImageSvc.replace.mock.calls[0].arguments[0].url,
				mockProduct.image,
			);

			assert.strictEqual(mockProductSvc.update.mock.callCount(), 1);
			assert.deepStrictEqual(
				mockProductSvc.update.mock.calls[0].arguments[0].data,
				{ image: newImageUrl, name: "Updated Product" },
			);
		});

		test("should return error when product not found during image update", async () => {
			// Arrange
			const mockFile = generateMockInsertProductWithMulterImage().image;
			const notFoundError = new Error("Product not found");
			const updateData = { image: mockFile };

			mockProductSvc.getById.mock.mockImplementationOnce(() =>
				Promise.resolve({ error: notFoundError, success: false }),
			);

			// Act
			const result = await manager.update({ data: updateData, productId });

			// Assert
			assert.strictEqual(result.success, false);
			assert.strictEqual(result.error, notFoundError);

			assert.strictEqual(mockProductSvc.getById.mock.callCount(), 1);
			assert.strictEqual(mockImageSvc.replace.mock.callCount(), 0);
			assert.strictEqual(mockProductSvc.update.mock.callCount(), 0);
		});

		test("should return error when image replacement fails", async () => {
			// Arrange
			const mockFile = generateMockInsertProductWithMulterImage().image;
			const replaceError = new Error("Cloudinary error");
			const updateData = { image: mockFile };

			mockProductSvc.getById.mock.mockImplementationOnce(() =>
				Promise.resolve({ data: mockProduct, success: true }),
			);
			mockImageSvc.replace.mock.mockImplementationOnce(() =>
				Promise.resolve({ error: replaceError, success: false }),
			);

			// Act
			const result = await manager.update({ data: updateData, productId });

			// Assert
			assert.strictEqual(result.success, false);
			assert.strictEqual(result.error, replaceError);

			assert.strictEqual(mockProductSvc.getById.mock.callCount(), 1);
			assert.strictEqual(mockImageSvc.replace.mock.callCount(), 1);
			assert.strictEqual(mockProductSvc.update.mock.callCount(), 0);
		});

		test("should return error when product service update fails", async () => {
			// Arrange
			const mockFile = generateMockInsertProductWithMulterImage().image;
			const newImageUrl = "https://cloudinary.com/new-image.jpg";
			const updateError = new Error("Database error");
			const updateData = { image: mockFile };

			mockProductSvc.getById.mock.mockImplementationOnce(() =>
				Promise.resolve({ data: mockProduct, success: true }),
			);
			mockImageSvc.replace.mock.mockImplementationOnce(() =>
				Promise.resolve({ data: newImageUrl, success: true }),
			);
			mockProductSvc.update.mock.mockImplementationOnce(() =>
				Promise.resolve({ error: updateError, success: false }),
			);

			// Act
			const result = await manager.update({ data: updateData, productId });

			// Assert
			assert.strictEqual(result.success, false);
			assert.strictEqual(result.error, updateError);

			assert.strictEqual(mockProductSvc.getById.mock.callCount(), 1);
			assert.strictEqual(mockImageSvc.replace.mock.callCount(), 1);
			assert.strictEqual(mockProductSvc.update.mock.callCount(), 1);
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

		test("should return paginated response when product service succeeds", async () => {
			// Arrange
			const args: GetAllProductsManagerParams = {
				pageNumber: "1",
				pageSize: "10",
			};
			mockProductSvc.getAll.mock.mockImplementationOnce(() =>
				Promise.resolve({ data: mockPaginatedResponse, success: true }),
			);

			// Act
			const result = await manager.getAll(args);

			// Assert
			assert.strictEqual(result.success, true);
			assert.deepStrictEqual(result.data, mockPaginatedResponse);

			assert.strictEqual(mockProductSvc.getAll.mock.callCount(), 1);
			assert.deepStrictEqual(
				mockProductSvc.getAll.mock.calls[0].arguments[0],
				args,
			);
		});

		test("should pass through arguments to product service", async () => {
			// Arrange
			const args: GetAllProductsManagerParams = {
				pageNumber: "2",
				pageSize: "5",
				filters: { keyword: "test" },
			};
			mockProductSvc.getAll.mock.mockImplementationOnce(() =>
				Promise.resolve({ data: mockPaginatedResponse, success: true }),
			);

			// Act
			await manager.getAll(args);

			// Assert
			assert.strictEqual(mockProductSvc.getAll.mock.callCount(), 1);
			assert.deepStrictEqual(
				mockProductSvc.getAll.mock.calls[0].arguments[0],
				args,
			);
		});
	});

	describe("getById", () => {
		const mockProduct = generateMockSelectProduct();
		const productId = mockProduct.id;

		test("should return product when product service succeeds", async () => {
			// Arrange
			mockProductSvc.getById.mock.mockImplementationOnce(() =>
				Promise.resolve({ data: mockProduct, success: true }),
			);

			// Act
			const result = await manager.getById({ productId });

			// Assert
			assert.strictEqual(result.success, true);
			assert.deepStrictEqual(result.data, mockProduct);

			assert.strictEqual(mockProductSvc.getById.mock.callCount(), 1);
			assert.deepStrictEqual(
				mockProductSvc.getById.mock.calls[0].arguments[0],
				{ productId },
			);
		});

		test("should pass through error from product service", async () => {
			// Arrange
			const notFoundError = new Error("Product not found");
			mockProductSvc.getById.mock.mockImplementationOnce(() =>
				Promise.resolve({ error: notFoundError, success: false }),
			);

			// Act
			const result = await manager.getById({ productId });

			// Assert
			assert.strictEqual(result.success, false);
			assert.strictEqual(result.error, notFoundError);
		});
	});

	describe("getTopRated", () => {
		const mockProducts = generateMockSelectProducts({ count: 3 });

		test("should return top rated products when product service succeeds", async () => {
			// Arrange
			mockProductSvc.getTopRated.mock.mockImplementationOnce(() =>
				Promise.resolve({ data: mockProducts, success: true }),
			);

			// Act
			const result = await manager.getTopRated();

			// Assert
			assert.strictEqual(result.success, true);
			assert.deepStrictEqual(result.data, mockProducts);

			assert.strictEqual(mockProductSvc.getTopRated.mock.callCount(), 1);
		});

		test("should pass through error from product service", async () => {
			// Arrange
			const serviceError = new Error("Database error");
			mockProductSvc.getTopRated.mock.mockImplementationOnce(() =>
				Promise.resolve({ error: serviceError, success: false }),
			);

			// Act
			const result = await manager.getTopRated();

			// Assert
			assert.strictEqual(result.success, false);
			assert.strictEqual(result.error, serviceError);
		});
	});
});
