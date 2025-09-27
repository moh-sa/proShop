import type { Request, Response } from "express";

import assert from "node:assert";
import test, { beforeEach, describe, suite } from "node:test";
import { ZodError } from "zod";

import type { InsertProduct } from "../../types/index.js";

import { ProductController } from "../../controllers/index.js";
import { createStrictSuccessResponseObject } from "../../utils/index.js";
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
					file: mockInsertProduct.image,
				},
				res: {
					locals: { user: { _id: mockInsertProduct.user.toString() } },
				},
				testContext: t,
			});

			mockService.create.mock.mockImplementationOnce(() =>
				Promise.resolve(mockSelectProduct),
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

		test("Should throw 'ZodError' if 'product.user' is invalid objectId", async (t) => {
			const { next, req, res } = mockExpressCall({
				req: {
					body: mockInsertProduct,
					file: mockInsertProduct.image,
				},
				res: {
					locals: { user: { _id: "invalid-user-id" } },
				},
				testContext: t,
			});

			await assert.rejects(
				async () =>
					await controller.create(
						req as unknown as Request,
						res as unknown as Response,
						next,
					),
				(error: Error) => {
					assert.ok(error instanceof ZodError);
					assert.strictEqual(error.issues.length, 1);
					assert.strictEqual(
						error.issues[0].message,
						"Invalid ObjectId format.",
					);
					return true;
				},
			);
		});

		test("Should throw 'ZodError' if 'product.name' is less than 1 char", async (t) => {
			const { next, req, res } = mockExpressCall({
				req: {
					body: { ...mockInsertProduct, name: "" },
					file: mockInsertProduct.image,
				},
				res: {
					locals: { user: { _id: mockInsertProduct.user.toString() } },
				},
				testContext: t,
			});

			await assert.rejects(
				async () =>
					await controller.create(
						req as unknown as Request,
						res as unknown as Response,
						next,
					),
				(error: Error) => {
					assert.ok(error instanceof ZodError);
					assert.strictEqual(error.issues.length, 1);
					assert.strictEqual(error.issues[0].message, "Name is required.");
					return true;
				},
			);
		});

		test("Should throw 'ZodError' if 'product.name' is not a string", async (t) => {
			const { next, req, res } = mockExpressCall({
				req: {
					body: { ...mockInsertProduct, name: 123 },
					file: mockInsertProduct.image,
				},
				res: {
					locals: { user: { _id: mockInsertProduct.user.toString() } },
				},
				testContext: t,
			});

			await assert.rejects(
				async () =>
					await controller.create(
						req as unknown as Request,
						res as unknown as Response,
						next,
					),
				(error: Error) => {
					assert.ok(error instanceof ZodError);
					assert.strictEqual(error.issues.length, 1);
					assert.strictEqual(
						error.issues[0].message,
						"Expected string, received number",
					);
					return true;
				},
			);
		});

		test("Should throw 'ZodError' if 'product.brand' is less than 1 char", async (t) => {
			const { next, req, res } = mockExpressCall({
				req: {
					body: { ...mockInsertProduct, brand: "" },
					file: mockInsertProduct.image,
				},
				res: {
					locals: { user: { _id: mockInsertProduct.user.toString() } },
				},
				testContext: t,
			});

			await assert.rejects(
				async () =>
					await controller.create(
						req as unknown as Request,
						res as unknown as Response,
						next,
					),
				(error: Error) => {
					assert.ok(error instanceof ZodError);
					assert.strictEqual(error.issues.length, 1);
					assert.strictEqual(error.issues[0].message, "Brand is required.");
					return true;
				},
			);
		});

		test("Should throw 'ZodError' if 'product.brand' is not a string", async (t) => {
			const { next, req, res } = mockExpressCall({
				req: {
					body: { ...mockInsertProduct, brand: 123 },
					file: mockInsertProduct.image,
				},
				res: {
					locals: { user: { _id: mockInsertProduct.user.toString() } },
				},
				testContext: t,
			});

			await assert.rejects(
				async () =>
					await controller.create(
						req as unknown as Request,
						res as unknown as Response,
						next,
					),
				(error: Error) => {
					assert.ok(error instanceof ZodError);
					assert.strictEqual(error.issues.length, 1);
					assert.strictEqual(
						error.issues[0].message,
						"Expected string, received number",
					);
					return true;
				},
			);
		});

		test("Should throw 'ZodError' if 'product.category' is less than 1 char", async (t) => {
			const { next, req, res } = mockExpressCall({
				req: {
					body: { ...mockInsertProduct, category: "" },
					file: mockInsertProduct.image,
				},
				res: {
					locals: { user: { _id: mockInsertProduct.user.toString() } },
				},
				testContext: t,
			});

			await assert.rejects(
				async () =>
					await controller.create(
						req as unknown as Request,
						res as unknown as Response,
						next,
					),
				(error: Error) => {
					assert.ok(error instanceof ZodError);
					assert.strictEqual(error.issues.length, 1);
					assert.strictEqual(error.issues[0].message, "Category is required.");
					return true;
				},
			);
		});

		test("Should throw 'ZodError' if 'product.category' is not a string", async (t) => {
			const { next, req, res } = mockExpressCall({
				req: {
					body: { ...mockInsertProduct, category: 123 },
					file: mockInsertProduct.image,
				},
				res: {
					locals: { user: { _id: mockInsertProduct.user.toString() } },
				},
				testContext: t,
			});

			await assert.rejects(
				async () =>
					await controller.create(
						req as unknown as Request,
						res as unknown as Response,
						next,
					),
				(error: Error) => {
					assert.ok(error instanceof ZodError);
					assert.strictEqual(error.issues.length, 1);
					assert.strictEqual(
						error.issues[0].message,
						"Expected string, received number",
					);
					return true;
				},
			);
		});

		test("Should throw 'ZodError' if 'product.description' is less than 1 char", async (t) => {
			const { next, req, res } = mockExpressCall({
				req: {
					body: { ...mockInsertProduct, description: "" },
					file: mockInsertProduct.image,
				},
				res: {
					locals: { user: { _id: mockInsertProduct.user.toString() } },
				},
				testContext: t,
			});

			await assert.rejects(
				async () =>
					await controller.create(
						req as unknown as Request,
						res as unknown as Response,
						next,
					),
				(error: Error) => {
					assert.ok(error instanceof ZodError);
					assert.strictEqual(error.issues.length, 1);
					assert.strictEqual(
						error.issues[0].message,
						"Description is required.",
					);
					return true;
				},
			);
		});

		test("Should throw 'ZodError' if 'product.description' is not a string", async (t) => {
			const { next, req, res } = mockExpressCall({
				req: {
					body: { ...mockInsertProduct, description: 123 },
					file: mockInsertProduct.image,
				},
				res: {
					locals: { user: { _id: mockInsertProduct.user.toString() } },
				},
				testContext: t,
			});

			await assert.rejects(
				async () =>
					await controller.create(
						req as unknown as Request,
						res as unknown as Response,
						next,
					),
				(error: Error) => {
					assert.ok(error instanceof ZodError);
					assert.strictEqual(error.issues.length, 1);
					assert.strictEqual(
						error.issues[0].message,
						"Expected string, received number",
					);
					return true;
				},
			);
		});

		test("Should convert a negative 'product.price' to '0'", async (t) => {
			const { next, req, res } = mockExpressCall({
				req: {
					body: { ...mockInsertProduct, price: 0 },
					file: mockInsertProduct.image,
				},
				res: {
					locals: { user: { _id: mockInsertProduct.user.toString() } },
				},
				testContext: t,
			});

			await controller.create(
				req as unknown as Request,
				res as unknown as Response,
				next,
			);

			assert.strictEqual(mockService.create.mock.callCount(), 1);
			assert.deepStrictEqual(mockService.create.mock.calls[0].arguments[0], {
				...mockInsertProduct,
				price: 0,
			});
		});

		test("Should throw 'ZodError' if 'product.price' is not a number", async (t) => {
			const { next, req, res } = mockExpressCall({
				req: {
					body: { ...mockInsertProduct, price: "invalid-price" },
					file: mockInsertProduct.image,
				},
				res: {
					locals: { user: { _id: mockInsertProduct.user.toString() } },
				},
				testContext: t,
			});

			await assert.rejects(
				async () =>
					await controller.create(
						req as unknown as Request,
						res as unknown as Response,
						next,
					),
				(error: Error) => {
					assert.ok(error instanceof ZodError);
					assert.strictEqual(error.issues.length, 1);
					assert.strictEqual(
						error.issues[0].message,
						"Expected number, received nan",
					);
					return true;
				},
			);
		});

		test("Should convert a negative 'product.countInStock' to '0'", async (t) => {
			const { next, req, res } = mockExpressCall({
				req: {
					body: { ...mockInsertProduct, countInStock: 0 },
					file: mockInsertProduct.image,
				},
				res: {
					locals: { user: { _id: mockInsertProduct.user.toString() } },
				},
				testContext: t,
			});

			await controller.create(
				req as unknown as Request,
				res as unknown as Response,
				next,
			);

			assert.strictEqual(mockService.create.mock.callCount(), 1);
			assert.deepStrictEqual(mockService.create.mock.calls[0].arguments[0], {
				...mockInsertProduct,
				countInStock: 0,
			});
		});

		test("Should throw 'ZodError' if 'product.countInStock' is not a number", async (t) => {
			const { next, req, res } = mockExpressCall({
				req: {
					body: { ...mockInsertProduct, countInStock: "invalid-stock" },
					file: mockInsertProduct.image,
				},
				res: {
					locals: { user: { _id: mockInsertProduct.user.toString() } },
				},
				testContext: t,
			});

			await assert.rejects(
				async () =>
					await controller.create(
						req as unknown as Request,
						res as unknown as Response,
						next,
					),
				(error: Error) => {
					assert.ok(error instanceof ZodError);
					assert.strictEqual(error.issues.length, 1);
					assert.strictEqual(
						error.issues[0].message,
						"Expected number, received nan",
					);
					return true;
				},
			);
		});

		test("Should call 'service.create' once with the correct 'product data'", async (t) => {
			const { next, req, res } = mockExpressCall({
				req: {
					body: mockInsertProduct,
					file: mockInsertProduct.image,
				},
				res: {
					locals: { user: { _id: mockInsertProduct.user.toString() } },
				},
				testContext: t,
			});

			mockService.create.mock.mockImplementationOnce(() =>
				Promise.resolve(mockSelectProduct),
			);

			await controller.create(
				req as unknown as Request,
				res as unknown as Response,
				next,
			);

			assert.strictEqual(mockService.create.mock.callCount(), 1);
			assert.deepStrictEqual(mockService.create.mock.calls[0].arguments[0], {
				...mockInsertProduct,
			});
		});

		test("Should call 'res.status' once with '201' after successfully creating product data", async (t) => {
			const { next, req, res } = mockExpressCall({
				req: {
					body: mockInsertProduct,
					file: mockInsertProduct.image,
				},
				res: {
					locals: { user: { _id: mockInsertProduct.user.toString() } },
				},
				testContext: t,
			});

			mockService.create.mock.mockImplementationOnce(() =>
				Promise.resolve(mockSelectProduct),
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
					file: mockInsertProduct.image,
				},
				res: {
					locals: { user: { _id: mockInsertProduct.user.toString() } },
				},
				testContext: t,
			});

			mockService.create.mock.mockImplementationOnce(() =>
				Promise.resolve(mockSelectProduct),
			);

			await controller.create(
				req as unknown as Request,
				res as unknown as Response,
				next,
			);

			assert.strictEqual(res.json.mock.callCount(), 1);
			assert.deepStrictEqual(
				res.json.mock.calls[0].arguments[0],
				createStrictSuccessResponseObject({ data: mockSelectProduct }),
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
				Promise.resolve(serviceResult),
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
				Promise.resolve(serviceResult),
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

		test("Should parse undefined 'keyword' from 'req.query' and default to empty string ", async (t) => {
			const { next, req, res } = mockExpressCall({
				req: { query: {} },
				testContext: t,
			});

			mockService.getAll.mock.mockImplementationOnce(() =>
				Promise.resolve(serviceResult),
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

		test("Should parse 'currentPage' from 'req.query'", async (t) => {
			const { next, req, res } = mockExpressCall({
				req: {
					query: {
						currentPage: "1",
					},
				},
				testContext: t,
			});

			mockService.getAll.mock.mockImplementationOnce(() =>
				Promise.resolve(serviceResult),
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
				mockService.getAll.mock.calls[0].arguments[0].currentPage,
				1,
			);
		});

		test("Should parse undefined 'currentPage' from 'req.query' and default to '1'", async (t) => {
			const { next, req, res } = mockExpressCall({
				req: { query: {} },
				testContext: t,
			});

			mockService.getAll.mock.mockImplementationOnce(() =>
				Promise.resolve(serviceResult),
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
				mockService.getAll.mock.calls[0].arguments[0].currentPage,
				1,
			);
		});

		test("Should throw 'ZodError' if 'currentPage' is not a number", async (t) => {
			const { next, req, res } = mockExpressCall({
				req: {
					query: {
						currentPage: "invalid-current-page",
					},
				},
				testContext: t,
			});

			await assert.rejects(
				async () =>
					await controller.getAll(
						req as unknown as Request,
						res as unknown as Response,
						next,
					),
				(error: Error) => {
					assert.ok(error instanceof ZodError);
					assert.strictEqual(error.issues.length, 1);
					assert.strictEqual(
						error.issues[0].message,
						"Expected number, received nan",
					);
					return true;
				},
			);
		});

		test("Should throw 'ZodError' if 'currentPage' is '0'", async (t) => {
			const { next, req, res } = mockExpressCall({
				req: {
					query: {
						currentPage: "0",
					},
				},
				testContext: t,
			});

			await assert.rejects(
				async () =>
					await controller.getAll(
						req as unknown as Request,
						res as unknown as Response,
						next,
					),
				(error: Error) => {
					assert.ok(error instanceof ZodError);
					assert.strictEqual(error.issues.length, 1);
					assert.strictEqual(
						error.issues[0].message,
						"Number must be greater than 0",
					);
					return true;
				},
			);
		});

		test("Should throw 'ZodError' if 'currentPage' is a negative number", async (t) => {
			const { next, req, res } = mockExpressCall({
				req: {
					query: {
						currentPage: "-1",
					},
				},
				testContext: t,
			});

			await assert.rejects(
				async () =>
					await controller.getAll(
						req as unknown as Request,
						res as unknown as Response,
						next,
					),
				(error: Error) => {
					assert.ok(error instanceof ZodError);
					assert.strictEqual(error.issues.length, 1);
					assert.strictEqual(
						error.issues[0].message,
						"Number must be greater than 0",
					);
					return true;
				},
			);
		});

		test("Should throw 'ZodError' if 'currentPage' is non-integer number", async (t) => {
			const { next, req, res } = mockExpressCall({
				req: {
					query: {
						currentPage: "1.5",
					},
				},
				testContext: t,
			});

			await assert.rejects(
				async () =>
					await controller.getAll(
						req as unknown as Request,
						res as unknown as Response,
						next,
					),
				(error: Error) => {
					assert.ok(error instanceof ZodError);
					assert.strictEqual(error.issues.length, 1);
					assert.strictEqual(
						error.issues[0].message,
						"Expected integer, received float",
					);
					return true;
				},
			);
		});

		test("Should call 'service.getAll' once with the correct 'keyword' and 'currentPage'", async (t) => {
			const { next, req, res } = mockExpressCall({
				req: {
					query: {
						currentPage: "1",
						keyword: mockProducts[0].name,
					},
				},
				testContext: t,
			});

			mockService.getAll.mock.mockImplementationOnce(() =>
				Promise.resolve(serviceResult),
			);

			await controller.getAll(
				req as unknown as Request,
				res as unknown as Response,
				next,
			);

			assert.strictEqual(mockService.getAll.mock.callCount(), 1);
			assert.deepStrictEqual(mockService.getAll.mock.calls[0].arguments[0], {
				currentPage: 1,
				keyword: mockProducts[0].name,
			});
		});

		test("Should call 'res.status' once with '200' after successfully fetching all products", async (t) => {
			const { next, req, res } = mockExpressCall({
				req: { query: {} },
				testContext: t,
			});

			mockService.getAll.mock.mockImplementationOnce(() =>
				Promise.resolve(serviceResult),
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
				Promise.resolve(serviceResult),
			);

			await controller.getAll(
				req as unknown as Request,
				res as unknown as Response,
				next,
			);

			assert.strictEqual(res.json.mock.callCount(), 1);
			assert.deepStrictEqual(
				res.json.mock.calls[0].arguments[0],
				createStrictSuccessResponseObject({
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
				Promise.resolve(serviceResult),
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
				Promise.resolve(serviceResult),
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
				Promise.resolve(serviceResult),
			);

			await controller.getTopRated(
				req as unknown as Request,
				res as unknown as Response,
				next,
			);

			assert.strictEqual(res.json.mock.callCount(), 1);
			assert.deepStrictEqual(
				res.json.mock.calls[0].arguments[0],
				createStrictSuccessResponseObject({
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
				Promise.resolve(mockProduct),
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

		test("Should throw 'ZodError' if 'productId' is invalid ObjectId", async (t) => {
			const { next, req, res } = mockExpressCall({
				req: { params: { productId: "invalid-product-id" } },
				testContext: t,
			});

			await assert.rejects(
				async () =>
					await controller.getById(
						req as unknown as Request,
						res as unknown as Response,
						next,
					),
				(error: Error) => {
					assert.ok(error instanceof ZodError);
					assert.strictEqual(error.issues.length, 1);
					assert.strictEqual(
						error.issues[0].message,
						"Invalid ObjectId format.",
					);
					return true;
				},
			);
		});

		test("Should call 'service.getById' once with the correct 'productId'", async (t) => {
			const { next, req, res } = mockExpressCall({
				req: { params: { productId: productId.toString() } },
				testContext: t,
			});

			mockService.getById.mock.mockImplementationOnce(() =>
				Promise.resolve(mockProduct),
			);

			await controller.getById(
				req as unknown as Request,
				res as unknown as Response,
				next,
			);

			assert.strictEqual(mockService.getById.mock.callCount(), 1);
			assert.deepStrictEqual(mockService.getById.mock.calls[0].arguments[0], {
				productId,
			});
		});

		test("Should call 'res.status' once with '200' after successfully fetching product data", async (t) => {
			const { next, req, res } = mockExpressCall({
				req: { params: { productId: productId.toString() } },
				testContext: t,
			});

			mockService.getById.mock.mockImplementationOnce(() =>
				Promise.resolve(mockProduct),
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
				Promise.resolve(mockProduct),
			);

			await controller.getById(
				req as unknown as Request,
				res as unknown as Response,
				next,
			);

			assert.strictEqual(res.json.mock.callCount(), 1);
			assert.deepStrictEqual(
				res.json.mock.calls[0].arguments[0],
				createStrictSuccessResponseObject({ data: mockProduct }),
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
				Promise.resolve(mockProduct),
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

		test("Should throw 'ZodError' if 'productId' is invalid ObjectId", async (t) => {
			const { next, req, res } = mockExpressCall({
				req: {
					body: updateData,
					params: { productId: "invalid-product-id" },
				},
				testContext: t,
			});

			await assert.rejects(
				async () =>
					await controller.update(
						req as unknown as Request,
						res as unknown as Response,
						next,
					),
				(error: Error) => {
					assert.ok(error instanceof ZodError);
					assert.strictEqual(error.issues.length, 1);
					assert.strictEqual(
						error.issues[0].message,
						"Invalid ObjectId format.",
					);
					return true;
				},
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
				Promise.resolve(mockProduct),
			);

			await controller.update(
				req as unknown as Request,
				res as unknown as Response,
				next,
			);

			assert.strictEqual(mockService.update.mock.callCount(), 1);
			assert.deepStrictEqual(mockService.update.mock.calls[0].arguments[0], {
				data: updateData,
				productId,
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
				Promise.resolve(mockProduct),
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
				Promise.resolve(mockProduct),
			);

			await controller.update(
				req as unknown as Request,
				res as unknown as Response,
				next,
			);

			assert.strictEqual(res.json.mock.callCount(), 1);
			assert.deepStrictEqual(
				res.json.mock.calls[0].arguments[0],
				createStrictSuccessResponseObject({ data: mockProduct }),
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

			mockService.delete.mock.mockImplementationOnce(() => Promise.resolve());

			await assert.doesNotReject(
				async () =>
					await controller.delete(
						req as unknown as Request,
						res as unknown as Response,
						next,
					),
			);
		});

		test("Should throw 'ZodError' if 'productId' is invalid ObjectId", async (t) => {
			const { next, req, res } = mockExpressCall({
				req: { params: { productId: "invalid-product-id" } },
				testContext: t,
			});

			await assert.rejects(
				async () =>
					await controller.delete(
						req as unknown as Request,
						res as unknown as Response,
						next,
					),
				(error: Error) => {
					assert.ok(error instanceof ZodError);
					assert.strictEqual(error.issues.length, 1);
					assert.strictEqual(
						error.issues[0].message,
						"Invalid ObjectId format.",
					);
					return true;
				},
			);
		});

		test("Should call 'service.delete' once with the correct 'productId'", async (t) => {
			const { next, req, res } = mockExpressCall({
				req: { params: { productId: productId.toString() } },
				testContext: t,
			});

			mockService.delete.mock.mockImplementationOnce(() => Promise.resolve());

			await controller.delete(
				req as unknown as Request,
				res as unknown as Response,
				next,
			);

			assert.strictEqual(mockService.delete.mock.callCount(), 1);
			assert.deepStrictEqual(mockService.delete.mock.calls[0].arguments[0], {
				productId,
			});
		});

		test("Should call 'res.status' once with '204' after successfully deleting product data", async (t) => {
			const { next, req, res } = mockExpressCall({
				req: { params: { productId: productId.toString() } },
				testContext: t,
			});

			mockService.delete.mock.mockImplementationOnce(() => Promise.resolve());

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

			mockService.delete.mock.mockImplementationOnce(() => Promise.resolve());

			await controller.delete(
				req as unknown as Request,
				res as unknown as Response,
				next,
			);

			assert.strictEqual(res.json.mock.callCount(), 1);
			assert.deepStrictEqual(
				res.json.mock.calls[0].arguments[0],
				createStrictSuccessResponseObject({ data: null }),
			);
		});
	});
});
