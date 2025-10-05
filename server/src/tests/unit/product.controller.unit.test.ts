import type { Request, Response } from "express";

import assert from "node:assert";
import test, { beforeEach, describe, suite } from "node:test";

import type { InsertProduct } from "../../types/index.js";

import { ProductController } from "../../controllers/index.js";
import { createSuccessResponseObject } from "../../utils/index.js";
import {
	generateMockInsertProductWithMulterImage,
	generateMockObjectId,
	generateMockSelectProduct,
	generateMockSelectProducts,
	mockExpressCall,
	mockProductService,
} from "../mocks/index.js";

suite("Product Controller 〖 Unit Tests 〗", () => {
	const mockService = mockProductService();
	const controller = new ProductController(mockService);

	beforeEach(() => {
		mockService.reset();
	});

	describe("create", () => {
		const mockInsertProduct = generateMockInsertProductWithMulterImage();
		const mockSelectProduct = generateMockSelectProduct();

		test("Should parse 'product data' from 'req.body' and 'res.locals'", async (t) => {
			const { next, req, res } = mockExpressCall({
				req: {
					body: mockInsertProduct,
					// @ts-expect-error - `file` expect the to be diskStorage
					file: mockInsertProduct.image,
				},
				res: {
					locals: { user: { _id: mockInsertProduct.user.toString() } },
				},
				testContext: t,
			});

			mockService.create.mock.mockImplementationOnce(() =>
				Promise.resolve({ data: mockSelectProduct, success: true }),
			);

			await assert.doesNotReject(
				async () =>
					await controller.create(
						req as unknown as Request,
						res as unknown as Response,
						next,
					),
			);
		});

		test("Should call 'service.create' once with the correct 'product data'", async (t) => {
			// Arrange
			const mockInsertProduct = generateMockInsertProductWithMulterImage();
			// @ts-expect-error - test case
			mockInsertProduct.user = mockInsertProduct.user._id.toString();

			const mockSelectProduct = generateMockSelectProduct();
			mockSelectProduct.user = mockInsertProduct.user;

			const { next, req, res } = mockExpressCall({
				req: {
					body: mockInsertProduct,
					// @ts-expect-error - `file` expect the to be diskStorage
					file: mockInsertProduct.image,
				},
				res: {
					locals: { user: { _id: mockInsertProduct.user.toString() } },
				},
				testContext: t,
			});

			mockService.create.mock.mockImplementationOnce(() =>
				Promise.resolve({ data: mockSelectProduct, success: true }),
			);

			// Act
			await controller.create(
				req as unknown as Request,
				res as unknown as Response,
				next,
			);

			// Assert
			assert.strictEqual(mockService.create.mock.callCount(), 1);
			assert.deepStrictEqual(mockService.create.mock.calls[0].arguments[0], {
				...mockInsertProduct,
			});
		});

		test("Should call 'res.status' once with '201' after successfully creating product data", async (t) => {
			const { next, req, res } = mockExpressCall({
				req: {
					body: mockInsertProduct,
					// @ts-expect-error - `file` expect the to be diskStorage
					file: mockInsertProduct.image,
				},
				res: {
					locals: { user: { _id: mockInsertProduct.user.toString() } },
				},
				testContext: t,
			});

			mockService.create.mock.mockImplementationOnce(() =>
				Promise.resolve({ data: mockSelectProduct, success: true }),
			);

			await controller.create(
				req as unknown as Request,
				res as unknown as Response,
				next,
			);

			assert.strictEqual(res.status.mock.callCount(), 1);
			assert.strictEqual(res.status.mock.calls[0].arguments[0], 201);
		});

		test("Should call 'res.json' once with the success response object containing product data", async (t) => {
			const { next, req, res } = mockExpressCall({
				req: {
					body: mockInsertProduct,
					// @ts-expect-error - `file` expect the to be diskStorage
					file: mockInsertProduct.image,
				},
				res: {
					locals: { user: { _id: mockInsertProduct.user.toString() } },
				},
				testContext: t,
			});

			mockService.create.mock.mockImplementationOnce(() =>
				Promise.resolve({ data: mockSelectProduct, success: true }),
			);

			await controller.create(
				req as unknown as Request,
				res as unknown as Response,
				next,
			);

			assert.strictEqual(res.json.mock.callCount(), 1);
			assert.deepStrictEqual(
				res.json.mock.calls[0].arguments[0],
				createSuccessResponseObject({ data: mockSelectProduct }),
			);
		});
	});

	describe("getAll", () => {
		const mockProducts = generateMockSelectProducts({ count: 5 });
		const serviceResult = {
			currentPage: 1,
			numberOfPages: 1,
			products: mockProducts,
		};

		test("Should parse 'keyword' from 'req.query'", async (t) => {
			const { next, req, res } = mockExpressCall({
				req: {
					query: {
						keyword: mockProducts[0].name,
					},
				},
				testContext: t,
			});

			mockService.getAll.mock.mockImplementationOnce(() =>
				Promise.resolve({ data: serviceResult, success: true }),
			);

			await assert.doesNotReject(
				async () =>
					await controller.getAll(
						req as unknown as Request,
						res as unknown as Response,
						next,
					),
			);

			assert.strictEqual(
				mockService.getAll.mock.calls[0].arguments[0].keyword,
				mockProducts[0].name,
			);
		});

		test("Should parse empty 'keyword' from 'req.query'", async (t) => {
			const { next, req, res } = mockExpressCall({
				req: {
					query: {
						keyword: "",
					},
				},
				testContext: t,
			});

			mockService.getAll.mock.mockImplementationOnce(() =>
				Promise.resolve({ data: serviceResult, success: true }),
			);

			await assert.doesNotReject(
				async () =>
					await controller.getAll(
						req as unknown as Request,
						res as unknown as Response,
						next,
					),
			);

			assert.strictEqual(
				mockService.getAll.mock.calls[0].arguments[0].keyword.length,
				0,
			);
		});

		test("Should call 'service.getAll' once with the correct 'keyword' and 'currentPage'", async (t) => {
			// Arrange
			const currentPage = "1";
			const keyword = mockProducts[0].name;

			const { next, req, res } = mockExpressCall({
				req: {
					query: {
						currentPage,
						keyword,
					},
				},
				testContext: t,
			});

			mockService.getAll.mock.mockImplementationOnce(() =>
				Promise.resolve({ data: serviceResult, success: true }),
			);

			// Act
			await controller.getAll(
				req as unknown as Request,
				res as unknown as Response,
				next,
			);

			// Assert
			assert.strictEqual(mockService.getAll.mock.callCount(), 1);
			assert.deepStrictEqual(mockService.getAll.mock.calls[0].arguments[0], {
				currentPage,
				keyword,
			});
		});

		test("Should call 'res.status' once with '200' after successfully fetching all products", async (t) => {
			const { next, req, res } = mockExpressCall({
				req: { query: {} },
				testContext: t,
			});

			mockService.getAll.mock.mockImplementationOnce(() =>
				Promise.resolve({ data: serviceResult, success: true }),
			);

			await controller.getAll(
				req as unknown as Request,
				res as unknown as Response,
				next,
			);

			assert.strictEqual(res.status.mock.callCount(), 1);
			assert.strictEqual(res.status.mock.calls[0].arguments[0], 200);
		});

		test("Should call 'res.json' once with the success response object containing all products", async (t) => {
			const { next, req, res } = mockExpressCall({
				req: { query: {} },
				testContext: t,
			});

			mockService.getAll.mock.mockImplementationOnce(() =>
				Promise.resolve({ data: serviceResult, success: true }),
			);

			await controller.getAll(
				req as unknown as Request,
				res as unknown as Response,
				next,
			);

			assert.strictEqual(res.json.mock.callCount(), 1);
			assert.deepStrictEqual(
				res.json.mock.calls[0].arguments[0],
				createSuccessResponseObject({
					data: serviceResult.products,
					meta: {
						currentPage: serviceResult.currentPage,
						numberOfPages: serviceResult.numberOfPages,
					},
				}),
			);
		});
	});

	describe("getTopRated", () => {
		const mockProducts = generateMockSelectProducts({ count: 5 });
		const serviceResult = mockProducts;

		test("Should call 'service.getTopRated' once without args", async (t) => {
			const { next, req, res } = mockExpressCall({
				testContext: t,
			});

			mockService.getTopRated.mock.mockImplementationOnce(() =>
				Promise.resolve({ data: serviceResult, success: true }),
			);

			await controller.getTopRated(
				req as unknown as Request,
				res as unknown as Response,
				next,
			);

			assert.strictEqual(mockService.getTopRated.mock.callCount(), 1);
			assert.strictEqual(
				mockService.getTopRated.mock.calls[0].arguments.length,
				0,
			);
		});

		test("Should call 'res.status' once with '200' after successfully fetching top rated products", async (t) => {
			const { next, req, res } = mockExpressCall({
				testContext: t,
			});

			mockService.getTopRated.mock.mockImplementationOnce(() =>
				Promise.resolve({ data: serviceResult, success: true }),
			);

			await controller.getTopRated(
				req as unknown as Request,
				res as unknown as Response,
				next,
			);

			assert.strictEqual(res.status.mock.callCount(), 1);
			assert.strictEqual(res.status.mock.calls[0].arguments[0], 200);
		});

		test("Should call 'res.json' once with the success response object containing top rated products", async (t) => {
			const { next, req, res } = mockExpressCall({
				testContext: t,
			});

			mockService.getTopRated.mock.mockImplementationOnce(() =>
				Promise.resolve({ data: serviceResult, success: true }),
			);

			await controller.getTopRated(
				req as unknown as Request,
				res as unknown as Response,
				next,
			);

			assert.strictEqual(res.json.mock.callCount(), 1);
			assert.deepStrictEqual(
				res.json.mock.calls[0].arguments[0],
				createSuccessResponseObject({
					data: serviceResult,
				}),
			);
		});
	});

	describe("getById", () => {
		const mockProduct = generateMockSelectProduct();
		const productId = mockProduct._id;

		test("Should parse 'productId' from 'req.params'", async (t) => {
			const { next, req, res } = mockExpressCall({
				req: { params: { productId: productId.toString() } },
				testContext: t,
			});

			mockService.getById.mock.mockImplementationOnce(() =>
				Promise.resolve({ data: mockProduct, success: true }),
			);

			await assert.doesNotReject(
				async () =>
					await controller.getById(
						req as unknown as Request,
						res as unknown as Response,
						next,
					),
			);
		});

		test("Should call 'service.getById' once with the correct 'productId'", async (t) => {
			// Arrange
			const { next, req, res } = mockExpressCall({
				req: { params: { productId: productId.toString() } },
				testContext: t,
			});

			mockService.getById.mock.mockImplementationOnce(() =>
				Promise.resolve({ data: mockProduct, success: true }),
			);

			// Act
			await controller.getById(
				req as unknown as Request,
				res as unknown as Response,
				next,
			);

			// Assert
			assert.strictEqual(mockService.getById.mock.callCount(), 1);
			assert.deepStrictEqual(mockService.getById.mock.calls[0].arguments[0], {
				productId: productId.toString(),
			});
		});

		test("Should call 'res.status' once with '200' after successfully fetching product data", async (t) => {
			const { next, req, res } = mockExpressCall({
				req: { params: { productId: productId.toString() } },
				testContext: t,
			});

			mockService.getById.mock.mockImplementationOnce(() =>
				Promise.resolve({ data: mockProduct, success: true }),
			);

			await controller.getById(
				req as unknown as Request,
				res as unknown as Response,
				next,
			);

			assert.strictEqual(res.status.mock.callCount(), 1);
			assert.strictEqual(res.status.mock.calls[0].arguments[0], 200);
		});

		test("Should call 'res.json' once with the success response object containing product data", async (t) => {
			const { next, req, res } = mockExpressCall({
				req: { params: { productId: productId.toString() } },
				testContext: t,
			});

			mockService.getById.mock.mockImplementationOnce(() =>
				Promise.resolve({ data: mockProduct, success: true }),
			);

			await controller.getById(
				req as unknown as Request,
				res as unknown as Response,
				next,
			);

			assert.strictEqual(res.json.mock.callCount(), 1);
			assert.deepStrictEqual(
				res.json.mock.calls[0].arguments[0],
				createSuccessResponseObject({ data: mockProduct }),
			);
		});
	});

	describe("update", () => {
		const mockProduct = generateMockSelectProduct();
		const productId = mockProduct._id;
		const updateData: Partial<InsertProduct> = {
			image: undefined,
			name: "new-name",
		};

		test("Should parse 'productId' from 'req.params'", async (t) => {
			const { next, req, res } = mockExpressCall({
				req: {
					body: updateData,
					params: { productId: productId.toString() },
				},
				testContext: t,
			});

			mockService.update.mock.mockImplementationOnce(() =>
				Promise.resolve({ data: mockProduct, success: true }),
			);

			await assert.doesNotReject(
				async () =>
					await controller.update(
						req as unknown as Request,
						res as unknown as Response,
						next,
					),
			);
		});

		test("Should call 'service.update' once with the correct 'productId'", async (t) => {
			const { next, req, res } = mockExpressCall({
				req: {
					body: updateData,
					params: { productId: productId.toString() },
				},
				testContext: t,
			});

			mockService.update.mock.mockImplementationOnce(() =>
				Promise.resolve({ data: mockProduct, success: true }),
			);

			await controller.update(
				req as unknown as Request,
				res as unknown as Response,
				next,
			);

			assert.strictEqual(mockService.update.mock.callCount(), 1);
			assert.deepStrictEqual(mockService.update.mock.calls[0].arguments[0], {
				data: updateData,
				productId: productId.toString(),
			});
		});

		test("Should call 'res.status' once with '200' after successfully updating product data", async (t) => {
			const { next, req, res } = mockExpressCall({
				req: {
					body: updateData,
					params: { productId: productId.toString() },
				},
				testContext: t,
			});

			mockService.update.mock.mockImplementationOnce(() =>
				Promise.resolve({ data: mockProduct, success: true }),
			);

			await controller.update(
				req as unknown as Request,
				res as unknown as Response,
				next,
			);

			assert.strictEqual(res.status.mock.callCount(), 1);
			assert.strictEqual(res.status.mock.calls[0].arguments[0], 200);
		});

		test("Should call 'res.json' once with the success response object containing product data", async (t) => {
			const { next, req, res } = mockExpressCall({
				req: {
					body: updateData,
					params: { productId: productId.toString() },
				},
				testContext: t,
			});

			mockService.update.mock.mockImplementationOnce(() =>
				Promise.resolve({ data: mockProduct, success: true }),
			);

			await controller.update(
				req as unknown as Request,
				res as unknown as Response,
				next,
			);

			assert.strictEqual(res.json.mock.callCount(), 1);
			assert.deepStrictEqual(
				res.json.mock.calls[0].arguments[0],
				createSuccessResponseObject({ data: mockProduct }),
			);
		});
	});

	describe("delete", () => {
		const productId = generateMockObjectId();

		test("Should parse 'productId' from 'req.params'", async (t) => {
			const { next, req, res } = mockExpressCall({
				req: { params: { productId: productId.toString() } },
				testContext: t,
			});

			mockService.delete.mock.mockImplementationOnce(() =>
				Promise.resolve({ data: undefined, success: true }),
			);

			await assert.doesNotReject(
				async () =>
					await controller.delete(
						req as unknown as Request,
						res as unknown as Response,
						next,
					),
			);
		});

		test("Should call 'service.delete' once with the correct 'productId'", async (t) => {
			const { next, req, res } = mockExpressCall({
				req: { params: { productId: productId.toString() } },
				testContext: t,
			});

			mockService.delete.mock.mockImplementationOnce(() =>
				Promise.resolve({ data: undefined, success: true }),
			);

			await controller.delete(
				req as unknown as Request,
				res as unknown as Response,
				next,
			);

			assert.strictEqual(mockService.delete.mock.callCount(), 1);
			assert.deepStrictEqual(mockService.delete.mock.calls[0].arguments[0], {
				productId: productId.toString(),
			});
		});

		test("Should call 'res.status' once with '204' after successfully deleting product data", async (t) => {
			const { next, req, res } = mockExpressCall({
				req: { params: { productId: productId.toString() } },
				testContext: t,
			});

			mockService.delete.mock.mockImplementationOnce(() =>
				Promise.resolve({ data: undefined, success: true }),
			);

			await controller.delete(
				req as unknown as Request,
				res as unknown as Response,
				next,
			);

			assert.strictEqual(res.status.mock.callCount(), 1);
			assert.strictEqual(res.status.mock.calls[0].arguments[0], 204);
		});

		test("Should call 'res.json' once with the success response object containing product data", async (t) => {
			const { next, req, res } = mockExpressCall({
				req: { params: { productId: productId.toString() } },
				testContext: t,
			});

			mockService.delete.mock.mockImplementationOnce(() =>
				Promise.resolve({ data: undefined, success: true }),
			);

			await controller.delete(
				req as unknown as Request,
				res as unknown as Response,
				next,
			);

			assert.strictEqual(res.json.mock.callCount(), 1);
			assert.deepStrictEqual(
				res.json.mock.calls[0].arguments[0],
				createSuccessResponseObject({ data: null }),
			);
		});
	});
});
