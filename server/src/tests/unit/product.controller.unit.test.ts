import { Request, Response } from "express";
import assert from "node:assert";
import test, { beforeEach, describe, suite } from "node:test";
import { ZodError } from "zod";
import { ProductController } from "../../controllers";
import { DatabaseError } from "../../errors";
import { InsertProduct } from "../../types";
import { createSuccessResponseObject } from "../../utils";
import {
  generateMockInsertProductWithMulterImage,
  generateMockObjectId,
  generateMockSelectProduct,
  generateMockSelectProducts,
  mockExpressCall,
  mockProductService,
} from "../mocks";

suite("Review Controller 〖 Unit Tests 〗", () => {
  const mockService = mockProductService();
  const controller = new ProductController(mockService);

  beforeEach(() => {
    mockService.reset();
  });

  describe("create", () => {
    const mockInsertProduct = generateMockInsertProductWithMulterImage();
    const mockSelectProduct = generateMockSelectProduct();

    test("Should parse 'product data' from 'req.body' and 'res.locals'", async (t) => {
      const { req, res, next } = mockExpressCall({
        testContext: t,
        req: {
          body: mockInsertProduct,
          file: mockInsertProduct.image,
        },
        res: {
          locals: { user: { _id: mockInsertProduct.user.toString() } },
        },
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
      const { req, res, next } = mockExpressCall({
        testContext: t,
        req: {
          body: mockInsertProduct,
          file: mockInsertProduct.image,
        },
        res: {
          locals: { user: { _id: "invalid-user-id" } },
        },
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
      const { req, res, next } = mockExpressCall({
        testContext: t,
        req: {
          body: { ...mockInsertProduct, name: "" },
          file: mockInsertProduct.image,
        },
        res: {
          locals: { user: { _id: mockInsertProduct.user.toString() } },
        },
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
      const { req, res, next } = mockExpressCall({
        testContext: t,
        req: {
          body: { ...mockInsertProduct, name: 123 },
          file: mockInsertProduct.image,
        },
        res: {
          locals: { user: { _id: mockInsertProduct.user.toString() } },
        },
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
      const { req, res, next } = mockExpressCall({
        testContext: t,
        req: {
          body: { ...mockInsertProduct, brand: "" },
          file: mockInsertProduct.image,
        },
        res: {
          locals: { user: { _id: mockInsertProduct.user.toString() } },
        },
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
      const { req, res, next } = mockExpressCall({
        testContext: t,
        req: {
          body: { ...mockInsertProduct, brand: 123 },
          file: mockInsertProduct.image,
        },
        res: {
          locals: { user: { _id: mockInsertProduct.user.toString() } },
        },
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
      const { req, res, next } = mockExpressCall({
        testContext: t,
        req: {
          body: { ...mockInsertProduct, category: "" },
          file: mockInsertProduct.image,
        },
        res: {
          locals: { user: { _id: mockInsertProduct.user.toString() } },
        },
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
      const { req, res, next } = mockExpressCall({
        testContext: t,
        req: {
          body: { ...mockInsertProduct, category: 123 },
          file: mockInsertProduct.image,
        },
        res: {
          locals: { user: { _id: mockInsertProduct.user.toString() } },
        },
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
      const { req, res, next } = mockExpressCall({
        testContext: t,
        req: {
          body: { ...mockInsertProduct, description: "" },
          file: mockInsertProduct.image,
        },
        res: {
          locals: { user: { _id: mockInsertProduct.user.toString() } },
        },
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
      const { req, res, next } = mockExpressCall({
        testContext: t,
        req: {
          body: { ...mockInsertProduct, description: 123 },
          file: mockInsertProduct.image,
        },
        res: {
          locals: { user: { _id: mockInsertProduct.user.toString() } },
        },
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
      const { req, res, next } = mockExpressCall({
        testContext: t,
        req: {
          body: { ...mockInsertProduct, price: 0 },
          file: mockInsertProduct.image,
        },
        res: {
          locals: { user: { _id: mockInsertProduct.user.toString() } },
        },
      });

      await controller.create(
        req as unknown as Request,
        res as unknown as Response,
        next,
      ),
        assert.strictEqual(mockService.create.mock.callCount(), 1);
      assert.deepStrictEqual(mockService.create.mock.calls[0].arguments[0], {
        ...mockInsertProduct,
        price: 0,
      });
    });

    test("Should throw 'ZodError' if 'product.price' is not a number", async (t) => {
      const { req, res, next } = mockExpressCall({
        testContext: t,
        req: {
          body: { ...mockInsertProduct, price: "invalid-price" },
          file: mockInsertProduct.image,
        },
        res: {
          locals: { user: { _id: mockInsertProduct.user.toString() } },
        },
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
      const { req, res, next } = mockExpressCall({
        testContext: t,
        req: {
          body: { ...mockInsertProduct, countInStock: 0 },
          file: mockInsertProduct.image,
        },
        res: {
          locals: { user: { _id: mockInsertProduct.user.toString() } },
        },
      });

      await controller.create(
        req as unknown as Request,
        res as unknown as Response,
        next,
      ),
        assert.strictEqual(mockService.create.mock.callCount(), 1);
      assert.deepStrictEqual(mockService.create.mock.calls[0].arguments[0], {
        ...mockInsertProduct,
        countInStock: 0,
      });
    });

    test("Should throw 'ZodError' if 'product.countInStock' is not a number", async (t) => {
      const { req, res, next } = mockExpressCall({
        testContext: t,
        req: {
          body: { ...mockInsertProduct, countInStock: "invalid-stock" },
          file: mockInsertProduct.image,
        },
        res: {
          locals: { user: { _id: mockInsertProduct.user.toString() } },
        },
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
      const { req, res, next } = mockExpressCall({
        testContext: t,
        req: {
          body: mockInsertProduct,
          file: mockInsertProduct.image,
        },
        res: {
          locals: { user: { _id: mockInsertProduct.user.toString() } },
        },
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

    test("Should throw 'DatabaseError' if 'service.create' rejects", async (t) => {
      const { req, res, next } = mockExpressCall({
        testContext: t,
        req: {
          body: mockInsertProduct,
          file: mockInsertProduct.image,
        },
        res: {
          locals: { user: { _id: mockInsertProduct.user.toString() } },
        },
      });

      mockService.create.mock.mockImplementationOnce(() =>
        Promise.reject(new DatabaseError()),
      );

      await assert.rejects(
        async () =>
          await controller.create(
            req as unknown as Request,
            res as unknown as Response,
            next,
          ),
        DatabaseError,
      );
    });

    test("Should call 'res.status' once with '201' after successfully creating product data", async (t) => {
      const { req, res, next } = mockExpressCall({
        testContext: t,
        req: {
          body: mockInsertProduct,
          file: mockInsertProduct.image,
        },
        res: {
          locals: { user: { _id: mockInsertProduct.user.toString() } },
        },
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
      const { req, res, next } = mockExpressCall({
        testContext: t,
        req: {
          body: mockInsertProduct,
          file: mockInsertProduct.image,
        },
        res: {
          locals: { user: { _id: mockInsertProduct.user.toString() } },
        },
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
        createSuccessResponseObject({ data: mockSelectProduct }),
      );
    });
  });

  describe("getAll", () => {
    const mockProducts = generateMockSelectProducts({ count: 5 });
    const serviceResult = {
      products: mockProducts,
      numberOfPages: 1,
      currentPage: 1,
    };

    test("Should parse 'keyword' from 'req.query'", async (t) => {
      const { req, res, next } = mockExpressCall({
        testContext: t,
        req: {
          query: {
            keyword: mockProducts[0].name,
          },
        },
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
      const { req, res, next } = mockExpressCall({
        testContext: t,
        req: {
          query: {
            keyword: "",
          },
        },
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
      const { req, res, next } = mockExpressCall({
        testContext: t,
        req: { query: {} },
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
      const { req, res, next } = mockExpressCall({
        testContext: t,
        req: {
          query: {
            currentPage: "1",
          },
        },
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
      const { req, res, next } = mockExpressCall({
        testContext: t,
        req: { query: {} },
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
      const { req, res, next } = mockExpressCall({
        testContext: t,
        req: {
          query: {
            currentPage: "invalid-current-page",
          },
        },
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
      const { req, res, next } = mockExpressCall({
        testContext: t,
        req: {
          query: {
            currentPage: "0",
          },
        },
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
      const { req, res, next } = mockExpressCall({
        testContext: t,
        req: {
          query: {
            currentPage: "-1",
          },
        },
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
      const { req, res, next } = mockExpressCall({
        testContext: t,
        req: {
          query: {
            currentPage: "1.5",
          },
        },
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
      const { req, res, next } = mockExpressCall({
        testContext: t,
        req: {
          query: {
            keyword: mockProducts[0].name,
            currentPage: "1",
          },
        },
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
        keyword: mockProducts[0].name,
        currentPage: 1,
      });
    });

    test("Should throw 'DatabaseError' if 'service.getAll' throws", async (t) => {
      const { req, res, next } = mockExpressCall({
        testContext: t,
        req: { query: {} },
      });

      mockService.getAll.mock.mockImplementationOnce(() =>
        Promise.reject(new DatabaseError()),
      );

      await assert.rejects(
        async () =>
          await controller.getAll(
            req as unknown as Request,
            res as unknown as Response,
            next,
          ),
        DatabaseError,
      );
    });

    test("Should call 'res.status' once with '200' after successfully fetching all products", async (t) => {
      const { req, res, next } = mockExpressCall({
        testContext: t,
        req: { query: {} },
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
      const { req, res, next } = mockExpressCall({
        testContext: t,
        req: { query: {} },
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
      const { req, res, next } = mockExpressCall({
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

    test("Should throw 'DatabaseError' if 'service.getTopRated' throws", async (t) => {
      const { req, res, next } = mockExpressCall({
        testContext: t,
      });

      mockService.getTopRated.mock.mockImplementationOnce(() =>
        Promise.reject(new DatabaseError()),
      );

      await assert.rejects(
        async () =>
          await controller.getTopRated(
            req as unknown as Request,
            res as unknown as Response,
            next,
          ),
        DatabaseError,
      );
    });

    test("Should call 'res.status' once with '200' after successfully fetching top rated products", async (t) => {
      const { req, res, next } = mockExpressCall({
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
      const { req, res, next } = mockExpressCall({
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
      const { req, res, next } = mockExpressCall({
        testContext: t,
        req: { params: { productId: productId.toString() } },
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
      const { req, res, next } = mockExpressCall({
        testContext: t,
        req: { params: { productId: "invalid-product-id" } },
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
      const { req, res, next } = mockExpressCall({
        testContext: t,
        req: { params: { productId: productId.toString() } },
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

    test("Should throw 'DatabaseError' if 'service.getById' throws", async (t) => {
      const { req, res, next } = mockExpressCall({
        testContext: t,
        req: { params: { productId: productId.toString() } },
      });

      mockService.getById.mock.mockImplementationOnce(() =>
        Promise.reject(new DatabaseError()),
      );

      await assert.rejects(
        async () =>
          await controller.getById(
            req as unknown as Request,
            res as unknown as Response,
            next,
          ),
        DatabaseError,
      );
    });

    test("Should call 'res.status' once with '200' after successfully fetching product data", async (t) => {
      const { req, res, next } = mockExpressCall({
        testContext: t,
        req: { params: { productId: productId.toString() } },
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
      const { req, res, next } = mockExpressCall({
        testContext: t,
        req: { params: { productId: productId.toString() } },
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
        createSuccessResponseObject({ data: mockProduct }),
      );
    });
  });

  describe("update", () => {
    const mockProduct = generateMockSelectProduct();
    const productId = mockProduct._id;
    const updateData: Partial<InsertProduct> = {
      name: "new-name",
      image: undefined,
    };

    test("Should parse 'productId' from 'req.params'", async (t) => {
      const { req, res, next } = mockExpressCall({
        testContext: t,
        req: {
          params: { productId: productId.toString() },
          body: updateData,
        },
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
      const { req, res, next } = mockExpressCall({
        testContext: t,
        req: {
          params: { productId: "invalid-product-id" },
          body: updateData,
        },
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
      const { req, res, next } = mockExpressCall({
        testContext: t,
        req: {
          params: { productId: productId.toString() },
          body: updateData,
        },
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
        productId,
        data: updateData,
      });
    });

    test("Should throw 'DatabaseError' if 'service.update' throws", async (t) => {
      const { req, res, next } = mockExpressCall({
        testContext: t,
        req: {
          params: { productId: productId.toString() },
          body: updateData,
        },
      });

      mockService.update.mock.mockImplementationOnce(() =>
        Promise.reject(new DatabaseError()),
      );

      await assert.rejects(
        async () =>
          await controller.update(
            req as unknown as Request,
            res as unknown as Response,
            next,
          ),
        DatabaseError,
      );
    });

    test("Should call 'res.status' once with '200' after successfully updating product data", async (t) => {
      const { req, res, next } = mockExpressCall({
        testContext: t,
        req: {
          params: { productId: productId.toString() },
          body: updateData,
        },
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
      const { req, res, next } = mockExpressCall({
        testContext: t,
        req: {
          params: { productId: productId.toString() },
          body: updateData,
        },
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
        createSuccessResponseObject({ data: mockProduct }),
      );
    });
  });

  describe("delete", () => {
    const productId = generateMockObjectId();

    test("Should parse 'productId' from 'req.params'", async (t) => {
      const { req, res, next } = mockExpressCall({
        testContext: t,
        req: { params: { productId: productId.toString() } },
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
      const { req, res, next } = mockExpressCall({
        testContext: t,
        req: { params: { productId: "invalid-product-id" } },
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
      const { req, res, next } = mockExpressCall({
        testContext: t,
        req: { params: { productId: productId.toString() } },
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

    test("Should throw 'DatabaseError' if 'service.delete' throws", async (t) => {
      const { req, res, next } = mockExpressCall({
        testContext: t,
        req: { params: { productId: productId.toString() } },
      });

      mockService.delete.mock.mockImplementationOnce(() =>
        Promise.reject(new DatabaseError()),
      );

      await assert.rejects(
        async () =>
          await controller.delete(
            req as unknown as Request,
            res as unknown as Response,
            next,
          ),
        DatabaseError,
      );
    });

    test("Should call 'res.status' once with '204' after successfully deleting product data", async (t) => {
      const { req, res, next } = mockExpressCall({
        testContext: t,
        req: { params: { productId: productId.toString() } },
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
      const { req, res, next } = mockExpressCall({
        testContext: t,
        req: { params: { productId: productId.toString() } },
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
        createSuccessResponseObject({ data: null }),
      );
    });
  });
});
