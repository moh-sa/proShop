import type { Request, Response } from "express";

import assert from "node:assert";
import test, { beforeEach, describe, suite } from "node:test";

import type { InsertProduct, SuccessResponse } from "../../types/index.js";

import { ProductController } from "../../controllers/index.js";
import { createSuccessResponseObject } from "../../utils/index.js";
import {
	generateMockInsertProductWithMulterImage,
	generateMockObjectId,
	generateMockSelectProduct,
	generateMockSelectProducts,
	mockExpressCall,
	mockProductManager,
} from "../mocks/index.js";
import { toCents } from "../utils/index.js";

suite("Product Controller 〖 Unit Tests 〗", () => {
	const mockManager = mockProductManager();
	const controller = new ProductController(mockManager);

	beforeEach(() => {
		mockManager.reset();
	});

	describe("create", () => {
		const mockInsertProduct = generateMockInsertProductWithMulterImage();
		const mockSelectProduct = generateMockSelectProduct();

		const userId = mockInsertProduct.user.toString();
		const priceInCents = toCents(mockInsertProduct.price);
		const priceInDollars = mockInsertProduct.price;

		test("Should convert price to cents when passing data to manager.create", async (t) => {
			// Arrange
			const { next, req, res } = mockExpressCall({
				req: {
					body: mockInsertProduct,
					// @ts-expect-error - `file` expect the to be diskStorage
					file: mockInsertProduct.image,
				},
				res: {
					locals: { user: { _id: userId } },
				},
				testContext: t,
			});

			mockManager.create.mock.mockImplementationOnce(() =>
				Promise.resolve({ data: mockSelectProduct, success: true }),
			);

			// Act
			await controller.create(
				req as unknown as Request,
				res as unknown as Response,
				next,
			);

			// Assert
			assert.strictEqual(
				mockManager.create.mock.calls[0].arguments[0].price,
				priceInCents,
			);
		});

		test("Should convert price to dollars in the response", async (t) => {
			// Arrange
			const productWithPriceInCents = {
				...mockSelectProduct,
				price: priceInCents,
			};

			const { next, req, res } = mockExpressCall({
				req: {
					body: mockInsertProduct,
					// @ts-expect-error - `file` expect the to be diskStorage
					file: mockInsertProduct.image,
				},
				res: {
					locals: { user: { _id: userId } },
				},
				testContext: t,
			});

			mockManager.create.mock.mockImplementationOnce(() =>
				Promise.resolve({ data: productWithPriceInCents, success: true }),
			);

			// Act
			await controller.create(
				req as unknown as Request,
				res as unknown as Response,
				next,
			);

			// Assert
			const args = res.json.mock.calls[0].arguments[0] as SuccessResponse<{
				data: typeof mockSelectProduct;
			}>;

			assert.strictEqual(args.data.price, priceInDollars);
		});

		test("Should parse 'product data' from 'req.body' and 'res.locals'", async (t) => {
			// Arrange
			const { next, req, res } = mockExpressCall({
				req: {
					body: mockInsertProduct,
					// @ts-expect-error - `file` expect the to be diskStorage
					file: mockInsertProduct.image,
				},
				res: {
					locals: { user: { _id: userId } },
				},
				testContext: t,
			});

			mockManager.create.mock.mockImplementationOnce(() =>
				Promise.resolve({ data: mockSelectProduct, success: true }),
			);

			// Act
			await controller.create(
				req as unknown as Request,
				res as unknown as Response,
				next,
			);

			// Assert
			const { price, ...args } = mockManager.create.mock.calls[0].arguments[0];
			assert.strictEqual(args.name, mockInsertProduct.name);
			assert.strictEqual(args.description, mockInsertProduct.description);
			assert.strictEqual(args.category, mockInsertProduct.category);
			assert.strictEqual(args.brand, mockInsertProduct.brand);
			assert.strictEqual(args.countInStock, mockInsertProduct.countInStock);
			assert.strictEqual(args.image, mockInsertProduct.image);
			assert.strictEqual(args.user.toString(), userId);
		});

		test("Should call 'res.status' once with '201' after successfully creating product data", async (t) => {
			// Arrange
			const { next, req, res } = mockExpressCall({
				req: {
					body: mockInsertProduct,
					// @ts-expect-error - `file` expect the to be diskStorage
					file: mockInsertProduct.image,
				},
				res: {
					locals: { user: { _id: userId } },
				},
				testContext: t,
			});

			mockManager.create.mock.mockImplementationOnce(() =>
				Promise.resolve({ data: mockSelectProduct, success: true }),
			);

			// Act
			await controller.create(
				req as unknown as Request,
				res as unknown as Response,
				next,
			);

			// Assert
			assert.strictEqual(res.status.mock.callCount(), 1);
			assert.strictEqual(res.status.mock.calls[0].arguments[0], 201);
		});

		test("Should call 'res.json' once with the success response object containing product data", async (t) => {
			// Arrange
			const { next, req, res } = mockExpressCall({
				req: {
					body: mockInsertProduct,
					// @ts-expect-error - `file` expect the to be diskStorage
					file: mockInsertProduct.image,
				},
				res: {
					locals: { user: { _id: userId } },
				},
				testContext: t,
			});

			mockManager.create.mock.mockImplementationOnce(() =>
				Promise.resolve({ data: mockSelectProduct, success: true }),
			);

			// Act
			await controller.create(
				req as unknown as Request,
				res as unknown as Response,
				next,
			);

			// Assert
			assert.strictEqual(res.json.mock.callCount(), 1);

			const args = res.json.mock.calls[0].arguments[0] as SuccessResponse<{
				data: typeof mockSelectProduct;
			}>;

			assert.strictEqual(args.success, true);
			assert.strictEqual(args.data._id, mockSelectProduct._id);
		});
	});

	describe("getAll", () => {
		const mockProducts = generateMockSelectProducts({ count: 5 });
		const productsWithPriceInCents = mockProducts.map((product) => ({
			...product,
			price: toCents(product.price),
		}));

		const productsWithPriceInDollars = mockProducts;

		const mockMeta = {
			currentPage: 1,
			hasNextPage: false,
			hasPreviousPage: false,
			pageSize: 10,
			totalItems: 5,
			totalPages: 1,
		};
		const serviceResult = {
			items: mockProducts,
			meta: mockMeta,
		};

		test("Should convert all product prices from cents to dollars in the response", async (t) => {
			// Arrange
			const { next, req, res } = mockExpressCall({
				req: { query: { pageNumber: "1" } },
				testContext: t,
			});

			mockManager.getAll.mock.mockImplementationOnce(() =>
				Promise.resolve({
					data: { items: productsWithPriceInCents, meta: mockMeta },
					success: true,
				}),
			);

			// Act
			await controller.getAll(
				req as unknown as Request,
				res as unknown as Response,
				next,
			);

			// Assert
			const response = res.json.mock.calls[0].arguments[0] as SuccessResponse<{
				data: typeof mockProducts;
			}>;

			response.data.forEach((product) => {
				const originalProduct = productsWithPriceInDollars.find(
					(p) => p.name === product.name,
				);

				assert.strictEqual(product.price, originalProduct?.price);
			});
		});

		test("Should parse 'keyword' from 'req.query'", async (t) => {
			// Arrange
			const { next, req, res } = mockExpressCall({
				req: {
					query: {
						keyword: mockProducts[0].name,
						pageNumber: "1",
					},
				},
				testContext: t,
			});

			mockManager.getAll.mock.mockImplementationOnce(() =>
				Promise.resolve({ data: serviceResult, success: true }),
			);

			// Act
			await controller.getAll(
				req as unknown as Request,
				res as unknown as Response,
				next,
			);

			// Assert
			assert.strictEqual(
				mockManager.getAll.mock.calls[0]?.arguments[0]?.keyword,
				mockProducts[0].name,
			);
		});

		test("Should parse empty 'keyword' from 'req.query'", async (t) => {
			// Arrange
			const { next, req, res } = mockExpressCall({
				req: {
					query: {
						keyword: "",
						pageNumber: "1",
					},
				},
				testContext: t,
			});

			mockManager.getAll.mock.mockImplementationOnce(() =>
				Promise.resolve({ data: serviceResult, success: true }),
			);

			// Act
			await controller.getAll(
				req as unknown as Request,
				res as unknown as Response,
				next,
			);

			// Assert
			assert.strictEqual(
				mockManager.getAll.mock.calls[0]?.arguments[0]?.keyword?.length,
				0,
			);
		});

		test("Should parse 'pageNumber' from 'req.query'", async (t) => {
			// Arrange
			const pageNumber = "2";
			const { next, req, res } = mockExpressCall({
				req: {
					query: {
						pageNumber,
					},
				},
				testContext: t,
			});

			mockManager.getAll.mock.mockImplementationOnce(() =>
				Promise.resolve({ data: serviceResult, success: true }),
			);

			// Act
			await controller.getAll(
				req as unknown as Request,
				res as unknown as Response,
				next,
			);

			// Assert
			assert.strictEqual(
				mockManager.getAll.mock.calls[0]?.arguments[0]?.pageNumber,
				pageNumber,
			);
		});

		test("Should parse 'pageSize' from 'req.query'", async (t) => {
			// Arrange
			const pageSize = "20";
			const { next, req, res } = mockExpressCall({
				req: {
					query: {
						pageNumber: "1",
						pageSize,
					},
				},
				testContext: t,
			});

			mockManager.getAll.mock.mockImplementationOnce(() =>
				Promise.resolve({ data: serviceResult, success: true }),
			);

			// Act
			await controller.getAll(req as any, res as any, next);

			// Assert
			assert.strictEqual(
				mockManager.getAll.mock.calls[0]?.arguments[0]?.pageSize,
				pageSize,
			);
		});

		test("Should parse 'sort' from 'req.query'", async (t) => {
			// Arrange
			const sort = "name:asc,price:desc";
			const { next, req, res } = mockExpressCall({
				req: {
					query: {
						pageNumber: "1",
						sort,
					},
				},
				testContext: t,
			});

			mockManager.getAll.mock.mockImplementationOnce(() =>
				Promise.resolve({ data: serviceResult, success: true }),
			);

			// Act
			await controller.getAll(
				req as unknown as Request,
				res as unknown as Response,
				next,
			);

			// Assert
			assert.strictEqual(
				mockManager.getAll.mock.calls[0]?.arguments[0]?.sort,
				sort,
			);
		});

		test("Should call 'service.getAll' once with all pagination parameters", async (t) => {
			// Arrange
			const pageNumber = "2";
			const pageSize = "15";
			const sort = "name:asc";
			const keyword = mockProducts[0].name;

			const { next, req, res } = mockExpressCall({
				req: {
					query: {
						keyword,
						pageNumber,
						pageSize,
						sort,
					},
				},
				testContext: t,
			});

			mockManager.getAll.mock.mockImplementationOnce(() =>
				Promise.resolve({ data: serviceResult, success: true }),
			);

			// Act
			await controller.getAll(
				req as unknown as Request,
				res as unknown as Response,
				next,
			);

			// Assert
			assert.strictEqual(mockManager.getAll.mock.callCount(), 1);
			assert.deepStrictEqual(mockManager.getAll.mock.calls[0]?.arguments[0], {
				keyword,
				pageNumber,
				pageSize,
				sort,
			});
		});

		test("Should call 'service.getAll' once with empty query object when no parameters provided", async (t) => {
			// Arrange
			const { next, req, res } = mockExpressCall({
				req: { query: { pageNumber: "1" } },
				testContext: t,
			});

			mockManager.getAll.mock.mockImplementationOnce(() =>
				Promise.resolve({ data: serviceResult, success: true }),
			);

			// Act
			await controller.getAll(
				req as unknown as Request,
				res as unknown as Response,
				next,
			);

			// Assert
			assert.strictEqual(mockManager.getAll.mock.callCount(), 1);
			assert.deepStrictEqual(mockManager.getAll.mock.calls[0]?.arguments[0], {
				pageNumber: "1",
			});
		});

		test("Should call 'res.status' once with '200' after successfully fetching all products", async (t) => {
			// Arrange
			const { next, req, res } = mockExpressCall({
				req: { query: { pageNumber: "1" } },
				testContext: t,
			});

			mockManager.getAll.mock.mockImplementationOnce(() =>
				Promise.resolve({ data: serviceResult, success: true }),
			);

			// Act
			await controller.getAll(
				req as unknown as Request,
				res as unknown as Response,
				next,
			);

			// Assert
			assert.strictEqual(res.status.mock.callCount(), 1);
			assert.strictEqual(res.status.mock.calls[0]?.arguments[0], 200);
		});

		test("Should call 'res.json' once with the success response object containing products and meta", async (t) => {
			// Arrange
			const { next, req, res } = mockExpressCall({
				req: { query: { pageNumber: "1" } },
				testContext: t,
			});

			mockManager.getAll.mock.mockImplementationOnce(() =>
				Promise.resolve({ data: serviceResult, success: true }),
			);

			// Act
			await controller.getAll(
				req as unknown as Request,
				res as unknown as Response,
				next,
			);

			// Assert
			assert.strictEqual(res.json.mock.callCount(), 1);
			assert.strictEqual(res.json.mock.calls[0]?.arguments[0].success, true);
			assert.deepStrictEqual(
				res.json.mock.calls[0]?.arguments[0].meta,
				serviceResult.meta,
			);
			assert.strictEqual(
				res.json.mock.calls[0]?.arguments[0].data.length,
				serviceResult.items.length,
			);
		});
	});

	describe("getTopRated", () => {
		const mockProducts = generateMockSelectProducts({ count: 5 });
		const productsWithPriceInCents = mockProducts.map((product) => ({
			...product,
			price: toCents(product.price),
		}));
		const productsWithPriceInDollars = mockProducts;

		test("Should convert all product prices from cents in the response", async (t) => {
			// Arrange
			const { next, req, res } = mockExpressCall({
				testContext: t,
			});

			mockManager.getTopRated.mock.mockImplementationOnce(() =>
				Promise.resolve({ data: productsWithPriceInCents, success: true }),
			);

			// Act
			await controller.getTopRated(
				req as unknown as Request,
				res as unknown as Response,
				next,
			);

			// Assert
			const response = res.json.mock.calls[0].arguments[0] as SuccessResponse<{
				data: typeof mockProducts;
			}>;

			response.data.forEach((product) => {
				const originalProduct = productsWithPriceInDollars.find(
					(p) => p.name === product.name,
				);

				assert.strictEqual(product.price, originalProduct?.price);
			});
		});

		test("Should call 'service.getTopRated' once without args", async (t) => {
			// Arrange
			const { next, req, res } = mockExpressCall({
				testContext: t,
			});

			mockManager.getTopRated.mock.mockImplementationOnce(() =>
				Promise.resolve({ data: productsWithPriceInDollars, success: true }),
			);

			// Act
			await controller.getTopRated(
				req as unknown as Request,
				res as unknown as Response,
				next,
			);

			// Assert
			assert.strictEqual(mockManager.getTopRated.mock.callCount(), 1);
			assert.strictEqual(
				mockManager.getTopRated.mock.calls[0].arguments.length,
				0,
			);
		});

		test("Should call 'res.status' once with '200' after successfully fetching top rated products", async (t) => {
			// Arrange
			const { next, req, res } = mockExpressCall({
				testContext: t,
			});

			mockManager.getTopRated.mock.mockImplementationOnce(() =>
				Promise.resolve({ data: productsWithPriceInDollars, success: true }),
			);

			// Act
			await controller.getTopRated(
				req as unknown as Request,
				res as unknown as Response,
				next,
			);

			// Assert
			assert.strictEqual(res.status.mock.callCount(), 1);
			assert.strictEqual(res.status.mock.calls[0].arguments[0], 200);
		});

		test("Should call 'res.json' once with the success response object containing top rated products", async (t) => {
			// Arrange
			const { next, req, res } = mockExpressCall({
				testContext: t,
			});

			mockManager.getTopRated.mock.mockImplementationOnce(() =>
				Promise.resolve({ data: productsWithPriceInDollars, success: true }),
			);

			// Act
			await controller.getTopRated(
				req as unknown as Request,
				res as unknown as Response,
				next,
			);

			// Assert
			assert.strictEqual(res.json.mock.callCount(), 1);

			const response = res.json.mock.calls[0].arguments[0] as SuccessResponse<{
				data: typeof mockProducts;
			}>;

			assert.strictEqual(response.success, true);
			assert.strictEqual(
				response.data.length,
				productsWithPriceInDollars.length,
			);
		});
	});

	describe("getById", () => {
		const mockProduct = generateMockSelectProduct();
		const productId = mockProduct._id.toString();

		const productWithPriceInCents = {
			...mockProduct,
			price: toCents(mockProduct.price),
		};
		const productWithPriceInDollars = mockProduct;

		test("Should convert price from cents in the response", async (t) => {
			// Arrange
			const { next, req, res } = mockExpressCall({
				req: { params: { productId } },
				testContext: t,
			});

			mockManager.getById.mock.mockImplementationOnce(() =>
				Promise.resolve({ data: productWithPriceInCents, success: true }),
			);

			// Act
			await controller.getById(
				req as unknown as Request,
				res as unknown as Response,
				next,
			);

			// Assert
			const response = res.json.mock.calls[0].arguments[0] as SuccessResponse<{
				data: typeof mockProduct;
			}>;

			assert.strictEqual(response.data.price, productWithPriceInDollars.price);
		});

		test("Should parse 'productId' from 'req.params'", async (t) => {
			// Arrange
			const { next, req, res } = mockExpressCall({
				req: { params: { productId } },
				testContext: t,
			});

			mockManager.getById.mock.mockImplementationOnce(() =>
				Promise.resolve({ data: mockProduct, success: true }),
			);

			// Act
			await controller.getById(
				req as unknown as Request,
				res as unknown as Response,
				next,
			);

			// Assert
			assert.strictEqual(mockManager.getById.mock.callCount(), 1);
			assert.deepStrictEqual(
				mockManager.getById.mock.calls[0].arguments[0].productId,
				productId,
			);
		});

		test("Should call 'res.status' once with '200' after successfully fetching product data", async (t) => {
			// Arrange
			const { next, req, res } = mockExpressCall({
				req: { params: { productId } },
				testContext: t,
			});

			mockManager.getById.mock.mockImplementationOnce(() =>
				Promise.resolve({ data: mockProduct, success: true }),
			);

			// Act
			await controller.getById(
				req as unknown as Request,
				res as unknown as Response,
				next,
			);

			// Assert
			assert.strictEqual(res.status.mock.callCount(), 1);
			assert.strictEqual(res.status.mock.calls[0].arguments[0], 200);
		});

		test("Should call 'res.json' once with the success response object containing product data", async (t) => {
			// Arrange
			const { next, req, res } = mockExpressCall({
				req: { params: { productId } },
				testContext: t,
			});

			mockManager.getById.mock.mockImplementationOnce(() =>
				Promise.resolve({ data: mockProduct, success: true }),
			);

			// Act
			await controller.getById(
				req as unknown as Request,
				res as unknown as Response,
				next,
			);

			// Assert
			assert.strictEqual(res.json.mock.callCount(), 1);

			const response = res.json.mock.calls[0].arguments[0] as SuccessResponse<{
				data: typeof mockProduct;
			}>;
			assert.strictEqual(response.success, true);
			assert.strictEqual(response.data._id, mockProduct._id);
		});
	});

	describe("update", () => {
		const mockProduct = generateMockSelectProduct();
		const productId = mockProduct._id.toString();
		const updateData: Partial<InsertProduct> = {
			image: undefined,
			name: "new-name",
		};

		// const priceInCents = toCents(mockProduct.price);
		// console.info("🍎 priceInCents 🍎 ", priceInCents);

		const productWithPriceInCents = {
			...mockProduct,
			price: toCents(mockProduct.price),
		};

		// console.info(
		// 	"🍎 productWithPriceInCents.price 1 🍎 ",
		// 	productWithPriceInCents.price,
		// );

		const productWithPriceInDollars = mockProduct;

		test("Should convert price to cents when passing data to manager.update", async (t) => {
			// Arrange
			const { next, req, res } = mockExpressCall({
				req: {
					body: { price: productWithPriceInDollars.price },
					params: { productId },
				},
				testContext: t,
			});

			mockManager.update.mock.mockImplementationOnce(() =>
				Promise.resolve({ data: productWithPriceInCents, success: true }),
			);

			// Act
			await controller.update(
				req as unknown as Request,
				res as unknown as Response,
				next,
			);

			// Assert
			assert.strictEqual(
				mockManager.update.mock.calls[0].arguments[0].data.price,
				productWithPriceInCents.price,
			);
		});

		test("Should convert price from cents in the response", async (t) => {
			// Arrange
			const priceInCents = 2999;
			const priceInDollars = 29.99;

			const productWithPriceInCents = {
				...mockProduct,
				price: priceInCents,
			};

			const { next, req, res } = mockExpressCall({
				req: {
					body: updateData,
					params: { productId },
				},
				testContext: t,
			});

			mockManager.update.mock.mockImplementationOnce(() =>
				Promise.resolve({ data: productWithPriceInCents, success: true }),
			);

			// Act
			await controller.update(
				req as unknown as Request,
				res as unknown as Response,
				next,
			);

			// Assert
			const response = res.json.mock.calls[0].arguments[0] as SuccessResponse<{
				data: typeof mockProduct;
			}>;

			assert.strictEqual(response.data.price, priceInDollars);
		});

		test("Should parse 'productId' from 'req.params'", async (t) => {
			// Arrange
			const { next, req, res } = mockExpressCall({
				req: {
					body: updateData,
					params: { productId },
				},
				testContext: t,
			});

			mockManager.update.mock.mockImplementationOnce(() =>
				Promise.resolve({ data: mockProduct, success: true }),
			);

			// Act
			await controller.update(
				req as unknown as Request,
				res as unknown as Response,
				next,
			);

			// Assert
			assert.strictEqual(mockManager.update.mock.callCount(), 1);
			assert.deepStrictEqual(
				mockManager.update.mock.calls[0].arguments[0].productId,
				productId,
			);
		});

		test("Should call 'res.status' once with '200' after successfully updating product data", async (t) => {
			// Arrange
			const { next, req, res } = mockExpressCall({
				req: {
					body: updateData,
					params: { productId },
				},
				testContext: t,
			});

			mockManager.update.mock.mockImplementationOnce(() =>
				Promise.resolve({ data: mockProduct, success: true }),
			);

			// Act
			await controller.update(
				req as unknown as Request,
				res as unknown as Response,
				next,
			);

			// Assert
			assert.strictEqual(res.status.mock.callCount(), 1);
			assert.strictEqual(res.status.mock.calls[0].arguments[0], 200);
		});

		test("Should call 'res.json' once with the success response object containing product data", async (t) => {
			// Arrange
			const { next, req, res } = mockExpressCall({
				req: {
					body: updateData,
					params: { productId },
				},
				testContext: t,
			});

			mockManager.update.mock.mockImplementationOnce(() =>
				Promise.resolve({ data: mockProduct, success: true }),
			);

			// Act
			await controller.update(
				req as unknown as Request,
				res as unknown as Response,
				next,
			);

			// Assert
			assert.strictEqual(res.json.mock.callCount(), 1);

			const response = res.json.mock.calls[0].arguments[0] as SuccessResponse<{
				data: typeof mockProduct;
			}>;

			assert.strictEqual(response.success, true);
			assert.strictEqual(response.data._id, mockProduct._id);
		});
	});

	describe("delete", () => {
		const productId = generateMockObjectId().toString();

		test("Should parse 'productId' from 'req.params'", async (t) => {
			// Arrange
			const { next, req, res } = mockExpressCall({
				req: { params: { productId } },
				testContext: t,
			});

			mockManager.delete.mock.mockImplementationOnce(() =>
				Promise.resolve({ data: undefined, success: true }),
			);

			// Act
			await controller.delete(
				req as unknown as Request,
				res as unknown as Response,
				next,
			);

			// Assert
			assert.strictEqual(mockManager.delete.mock.callCount(), 1);
			assert.deepStrictEqual(
				mockManager.delete.mock.calls[0].arguments[0].productId,
				productId,
			);
		});

		test("Should call 'res.status' once with '204' after successfully deleting product data", async (t) => {
			// Arrange
			const { next, req, res } = mockExpressCall({
				req: { params: { productId } },
				testContext: t,
			});

			mockManager.delete.mock.mockImplementationOnce(() =>
				Promise.resolve({ data: undefined, success: true }),
			);

			// Act
			await controller.delete(
				req as unknown as Request,
				res as unknown as Response,
				next,
			);

			// Assert
			assert.strictEqual(res.status.mock.callCount(), 1);
			assert.strictEqual(res.status.mock.calls[0].arguments[0], 204);
		});

		test("Should call 'res.json' once with the success response object containing product data", async (t) => {
			// Arrange
			const { next, req, res } = mockExpressCall({
				req: { params: { productId } },
				testContext: t,
			});

			mockManager.delete.mock.mockImplementationOnce(() =>
				Promise.resolve({ data: undefined, success: true }),
			);

			// Act
			await controller.delete(
				req as unknown as Request,
				res as unknown as Response,
				next,
			);

			// Assert
			assert.strictEqual(res.json.mock.callCount(), 1);
			assert.deepStrictEqual(
				res.json.mock.calls[0].arguments[0],
				createSuccessResponseObject({ data: null }),
			);
		});
	});
});
