import assert from "node:assert/strict";
import test, { after, before, beforeEach, describe, suite } from "node:test";

import { ValidationError } from "../../errors/index.js";
import { ProductManager } from "../../managers/product.manager.js";
import { ProductModel } from "../../models/product.model.js";
import { ProductRepository } from "../../repositories/index.js";
import { CacheService, ProductService } from "../../services/index.js";
import type { GetAllProductsManagerParams } from "../../types/index.js";
import {
	generateMockInsertProductsWithStringImage,
	generateMockInsertProductWithMulterImage,
	generateMockInsertProductWithStringImage,
	generateMockObjectId,
	mockImageStorage,
} from "../mocks/index.js";
import {
	connectTestDatabase,
	createProduct,
	createProducts,
	disconnectTestDatabase,
} from "../utils/index.js";

suite("Product Manager 〖 Integration Tests 〗", () => {
	const cacheService = new CacheService("product");
	const productRepository = new ProductRepository(ProductModel, cacheService);
	const productService = new ProductService(productRepository);
	const mockImageSvc = mockImageStorage();
	const productManager = new ProductManager(productService, mockImageSvc);

	before(async () => await connectTestDatabase());
	after(async () => await disconnectTestDatabase());

	beforeEach(async () => {
		await ProductModel.deleteMany({});
		cacheService.flush();
		mockImageSvc.reset();
	});

	describe("create", () => {
		const mockImageUrl = "https://cloudinary.com/proshop/image-id.avif";

		test("should create product when image upload succeeds and data is valid", async () => {
			// Arrange
			const mockProduct = generateMockInsertProductWithMulterImage();
			mockImageSvc.upload.mock.mockImplementationOnce(() =>
				Promise.resolve({ data: mockImageUrl, success: true }),
			);

			// Act
			const result = await productManager.create(mockProduct);

			// Assert
			assert.strictEqual(result.success, true);
			assert.ok(result.data.id);
			assert.strictEqual(result.data.name, mockProduct.name);
			assert.strictEqual(result.data.brand, mockProduct.brand);
			assert.strictEqual(result.data.category, mockProduct.category);
			assert.strictEqual(result.data.description, mockProduct.description);
			assert.strictEqual(result.data.price, mockProduct.price);
			assert.strictEqual(result.data.countInStock, mockProduct.countInStock);
			assert.strictEqual(result.data.image, mockImageUrl);
			assert.strictEqual(result.data.rating, 0);
			assert.strictEqual(result.data.numReviews, 0);

			assert.strictEqual(mockImageSvc.upload.mock.callCount(), 1);
		});

		test("should return validation error when image is missing", async () => {
			// Arrange
			const mockProduct = {
				...generateMockInsertProductWithMulterImage(),
				image: undefined,
			};

			// Act
			const result = await productManager.create(mockProduct);

			// Assert
			assert.strictEqual(result.success, false);
			assert.ok(result.error instanceof ValidationError);

			const count = await productRepository.count({});
			assert.strictEqual(count.success, true);
			assert.strictEqual(count.data, 0);
		});

		test("should return error when image upload fails", async () => {
			// Arrange
			const mockProduct = generateMockInsertProductWithMulterImage();
			const uploadError = new Error("Cloudinary upload failed");
			mockImageSvc.upload.mock.mockImplementationOnce(() =>
				Promise.resolve({ error: uploadError, success: false }),
			);

			// Act
			const result = await productManager.create(mockProduct);

			// Assert
			assert.strictEqual(result.success, false);
			assert.strictEqual(result.error, uploadError);

			const count = await productRepository.count({});
			assert.strictEqual(count.success, true);
			assert.strictEqual(count.data, 0);
		});
	});

	describe("delete", () => {
		test("should delete product and its image when product exists", async () => {
			// Arrange
			const createdProduct = await createProduct(
				generateMockInsertProductWithStringImage(),
			);

			mockImageSvc.delete.mock.mockImplementationOnce(() =>
				Promise.resolve({ data: undefined, success: true }),
			);

			// Act
			const result = await productManager.delete({
				productId: createdProduct.id,
			});

			// Assert
			assert.strictEqual(result.success, true);

			const deletedProduct = await productRepository.getById({
				productId: createdProduct.id,
			});
			assert.ok(deletedProduct.success);
			assert.strictEqual(deletedProduct.data, null);

			assert.strictEqual(mockImageSvc.delete.mock.callCount(), 1);
			assert.strictEqual(
				mockImageSvc.delete.mock.calls[0].arguments[0].url,
				createdProduct.image,
			);
		});

		test("should return error when product does not exist", async () => {
			// Arrange
			const nonExistentId = generateMockObjectId();

			// Act
			const result = await productManager.delete({ productId: nonExistentId });

			// Assert
			assert.strictEqual(result.success, false);
			assert.strictEqual(mockImageSvc.delete.mock.callCount(), 0);
		});

		test("should return error when image deletion fails", async () => {
			// Arrange
			const mockProduct = generateMockInsertProductWithStringImage();
			const createdProduct = await createProduct(mockProduct);

			const deleteError = new Error("Cloudinary deletion failed");
			mockImageSvc.delete.mock.mockImplementationOnce(() =>
				Promise.resolve({ error: deleteError, success: false }),
			);

			// Act
			const result = await productManager.delete({
				productId: createdProduct.id,
			});

			// Assert
			assert.strictEqual(result.success, false);
			assert.strictEqual(result.error, deleteError);

			const stillExists = await productRepository.getById({
				productId: createdProduct.id,
			});
			assert.ok(stillExists.success);
			assert.strictEqual(stillExists.data, null);
		});
	});

	describe("update", () => {
		test("should update product without changing image when no image provided", async () => {
			// Arrange
			const createdProduct = await createProduct(
				generateMockInsertProductWithStringImage(),
			);

			const originalImage = createdProduct.image;
			const updateData = {
				name: "Updated Product Name",
				price: 999,
			};

			// Act
			const result = await productManager.update({
				data: updateData,
				productId: createdProduct.id,
			});

			// Assert
			assert.strictEqual(result.success, true);
			assert.strictEqual(result.data.name, updateData.name);
			assert.strictEqual(result.data.price, updateData.price);
			assert.strictEqual(result.data.image, originalImage);

			assert.strictEqual(mockImageSvc.replace.mock.callCount(), 0);

			const updatedProduct = await productRepository.getById({
				productId: createdProduct.id,
			});
			assert.ok(updatedProduct.success);
			assert.ok(updatedProduct.data);

			assert.strictEqual(updatedProduct.data.name, updateData.name);
			assert.strictEqual(updatedProduct.data.price, updateData.price);
			assert.strictEqual(updatedProduct.data.image, originalImage);
		});

		test("should update product and replace image when image is provided", async () => {
			// Arrange
			const createdProduct = await createProduct(
				generateMockInsertProductWithStringImage(),
			);

			const originalImage = createdProduct.image;
			const newImageFile = generateMockInsertProductWithMulterImage().image;
			const newImageUrl = "https://cloudinary.com/proshop/new-image.avif";
			const updateData = {
				image: newImageFile,
				name: "Updated Product Name",
			};

			mockImageSvc.replace.mock.mockImplementationOnce(() =>
				Promise.resolve({ data: newImageUrl, success: true }),
			);

			// Act
			const result = await productManager.update({
				data: updateData,
				productId: createdProduct.id,
			});

			// Assert
			assert.strictEqual(result.success, true);
			assert.strictEqual(result.data.name, updateData.name);
			assert.strictEqual(result.data.image, newImageUrl);

			assert.strictEqual(mockImageSvc.replace.mock.callCount(), 1);
			assert.deepStrictEqual(
				mockImageSvc.replace.mock.calls[0].arguments[0].file,
				newImageFile,
			);
			assert.strictEqual(
				mockImageSvc.replace.mock.calls[0].arguments[0].url,
				originalImage,
			);

			const updatedProduct = await productRepository.getById({
				productId: createdProduct.id,
			});
			assert.ok(updatedProduct.success);
			assert.ok(updatedProduct.data);
			assert.strictEqual(updatedProduct.data.name, updateData.name);
			assert.strictEqual(updatedProduct.data.image, newImageUrl);
		});

		test("should return error when product does not exist", async () => {
			// Arrange
			const nonExistentId = generateMockObjectId();
			const updateData = { name: "Updated Name" };

			// Act
			const result = await productManager.update({
				data: updateData,
				productId: nonExistentId,
			});

			// Assert
			assert.strictEqual(result.success, false);
		});

		test("should return error when image replacement fails", async () => {
			// Arrange
			const createdProduct = await createProduct(
				generateMockInsertProductWithStringImage(),
			);

			const newImageFile = generateMockInsertProductWithMulterImage().image;
			const replaceError = new Error("Cloudinary replace failed");
			const updateData = { image: newImageFile };

			mockImageSvc.replace.mock.mockImplementationOnce(() =>
				Promise.resolve({ error: replaceError, success: false }),
			);

			// Act
			const result = await productManager.update({
				data: updateData,
				productId: createdProduct.id,
			});

			// Assert
			assert.strictEqual(result.success, false);
			assert.strictEqual(result.error, replaceError);
		});
	});

	describe("getAll", () => {
		test("should delegate to product service and return result", async () => {
			// Arrange
			await createProducts(
				generateMockInsertProductsWithStringImage({
					count: 2,
				}),
			);

			const args: GetAllProductsManagerParams = {
				pageNumber: "1",
				pageSize: "10",
			};

			// Act
			const result = await productManager.getAll(args);

			// Assert
			assert.strictEqual(result.success, true);
			assert.ok(Array.isArray(result.data.items));
			assert.ok(result.data.meta);
		});
	});

	describe("getById", () => {
		test("should delegate to product service and return result", async () => {
			// Arrange
			const createdProduct = await createProduct(
				generateMockInsertProductWithStringImage(),
			);

			// Act
			const result = await productManager.getById({
				productId: createdProduct.id,
			});

			// Assert
			assert.strictEqual(result.success, true);
			assert.strictEqual(result.data.id, createdProduct.id);
		});
	});

	describe("getTopRated", () => {
		test("should delegate to product service and return result", async () => {
			// Arrange
			await createProducts(
				generateMockInsertProductsWithStringImage({
					count: 2,
				}),
			);

			// Act
			const result = await productManager.getTopRated();

			// Assert
			assert.strictEqual(result.success, true);
			assert.ok(Array.isArray(result.data));
		});
	});
});
