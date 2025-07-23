// import assert from "node:assert";
import { after, before, beforeEach, describe, suite, test } from "node:test";
// import request from "supertest";
import { ProductController } from "../../controllers";
import Product from "../../models/productModel";
// import { app } from "../../server";
// import {
//   generateMockInsertProductWithMulterImage,
//   generateMockInsertProductWithStringImage,
//   generateMockObjectId,
//   generateMockSelectProducts,
// } from "../mocks";
import assert from "node:assert";
import { ZodError } from "zod";
import { NotFoundError } from "../../errors";
import { CacheManager } from "../../managers";
import { ProductRepository } from "../../repositories";
import { ProductService } from "../../services";
import { InsertProduct } from "../../types";
import {
  generateMockInsertProductWithMulterImage,
  generateMockObjectId,
  generateMockSelectProduct,
  generateMockSelectProducts,
  generateMockUser,
  mockImageStorage,
} from "../mocks";
import { createMockExpressContext } from "../utils";
import {
  connectTestDatabase,
  disconnectTestDatabase,
} from "../utils/database-connection.utils";

suite("Product Controller 〖 Integration Tests 〗", () => {
  const cache = new CacheManager("product");
  const repo = new ProductRepository(Product, cache);
  const storage = mockImageStorage();
  const service = new ProductService(repo, storage);
  const controller = new ProductController(service);

  before(async () => await connectTestDatabase());
  after(async () => await disconnectTestDatabase());

  beforeEach(async () => {
    await Product.deleteMany({});
    await cache.flush();
  });

  describe("create", () => {
    test("Should return success response when 'service.create' is called with valid data", async () => {
      // Arrange
      const mockUser = generateMockUser();
      const { image, ...mockProduct } =
        generateMockInsertProductWithMulterImage();

      const { req, res, next } = createMockExpressContext();
      req.body = mockProduct;
      req.file = image;
      res.locals.user = mockUser;
      storage.upload.mock.mockImplementationOnce(() =>
        Promise.resolve("http://example.com/image.jpg"),
      );

      // Act
      await controller.create(req, res, next);

      // Assert
      const response = res._getJSONData();
      assert.ok(response);
      assert.ok(response.success);
      assert.ok(response.data);
    });

    test("Should return '201' status code when 'service.create' is called with valid data", async () => {
      // Arrange
      const mockUser = generateMockUser();
      const { image, ...mockProduct } =
        generateMockInsertProductWithMulterImage();

      const { req, res, next } = createMockExpressContext();
      req.body = mockProduct;
      req.file = image;
      res.locals.user = mockUser;
      storage.upload.mock.mockImplementationOnce(() =>
        Promise.resolve("http://example.com/image.jpg"),
      );

      // Act
      await controller.create(req, res, next);

      // Assert
      assert.strictEqual(res._getStatusCode(), 201);
    });

    test("Should create product when 'service.create' is called with valid data", async () => {
      // Arrange
      const mockUser = generateMockUser();
      const { image, ...mockProduct } =
        generateMockInsertProductWithMulterImage();

      const { req, res, next } = createMockExpressContext();
      req.body = mockProduct;
      req.file = image;
      res.locals.user = mockUser;
      storage.upload.mock.mockImplementationOnce(() =>
        Promise.resolve("http://example.com/image.jpg"),
      );

      // Act
      await controller.create(req, res, next);

      // Assert
      const response = res._getJSONData();
      assert.ok(response);
      assert.ok(response.data);
      assert.ok(response.data._id);
      assert.strictEqual(response.data.user, mockUser._id.toString());
      assert.strictEqual(response.data.name, mockProduct.name);
      assert.strictEqual(response.data.brand, mockProduct.brand);
      assert.strictEqual(response.data.category, mockProduct.category);
      assert.strictEqual(response.data.description, mockProduct.description);
      assert.strictEqual(response.data.price, mockProduct.price);
      assert.strictEqual(response.data.countInStock, mockProduct.countInStock);
    });

    test("Should throw 'ZodError' when 'service.create' is called without required fields", async () => {
      // Arrange
      const mockUser = generateMockUser();
      const { name, ...mockProduct } =
        generateMockInsertProductWithMulterImage();
      const { req, res, next } = createMockExpressContext();
      req.body = mockProduct;
      req.file = mockProduct.image;
      res.locals.user = mockUser;

      await assert.rejects(
        async () => await controller.create(req, res, next),
        (error: unknown) => {
          assert.ok(error instanceof ZodError);
          assert.strictEqual(error.errors.length, 1);
          assert.strictEqual(error.errors[0].path.length, 1);
          assert.strictEqual(error.errors[0].path[0], "name");
          assert.strictEqual(error.errors[0].message, "Required");
          return true;
        },
      );
    });
  });

  describe("getAll", () => {
    test("Should return success response when 'service.getAll' is called with valid data", async () => {
      // Arrange
      const mockProducts = generateMockSelectProducts({ count: 3 });
      await Product.insertMany(mockProducts);

      const { req, res, next } = createMockExpressContext();

      // Act
      await controller.getAll(req, res, next);

      // Assert
      const response = res._getJSONData();
      assert.ok(response);
      assert.ok(response.success);
      assert.ok(response.data);
      assert.strictEqual(response.data.length, mockProducts.length);
      assert.strictEqual(response.meta.currentPage, 1);
      assert.strictEqual(response.meta.numberOfPages, 1);
    });

    test("Should return '200' status code when 'service.getAll' is called with valid data", async () => {
      // Arrange
      const { req, res, next } = createMockExpressContext();

      // Act
      await controller.getAll(req, res, next);

      // Assert
      const code = res._getStatusCode();
      assert.strictEqual(code, 200);
    });

    test("Should return 'meta data' containing 'currentPage' and 'numberOfPages' when 'service.getAll' is called with valid data", async () => {
      // Arrange
      const { req, res, next } = createMockExpressContext();

      // Act
      await controller.getAll(req, res, next);

      // Assert
      const response = res._getJSONData();
      assert.ok(response);
      assert.ok(response.meta);
      assert.strictEqual(response.meta.currentPage, 1); // default value
      assert.strictEqual(response.meta.numberOfPages, 1); // default value
    });

    test("Should return array of products when 'service.getAll' is called with existing products", async () => {
      // Arrange
      const { req, res, next } = createMockExpressContext();
      const mockProducts = generateMockSelectProducts({ count: 3 });
      await Product.insertMany(mockProducts);

      // Act
      await controller.getAll(req, res, next);

      // Assert
      const response = res._getJSONData();
      assert.ok(response);
      assert.ok(response.data);
      assert.ok(Array.isArray(response.data));
      assert.strictEqual(response.data.length, mockProducts.length);
    });

    test("Should return filtered products when 'service.getAll' is called with keyword", async () => {
      // Arrange
      const { req, res, next } = createMockExpressContext();
      const mockProducts = generateMockSelectProducts({ count: 20 });
      const targetProduct = mockProducts[0];
      const keyword = targetProduct.name;

      await Product.insertMany(mockProducts);
      req.query = { keyword };

      // Act
      await controller.getAll(req, res, next);

      // Assert
      const response = res._getJSONData();
      assert.ok(response);
      assert.ok(response.data);
      assert.strictEqual(response.data.length, 1);
      assert.strictEqual(response.data[0].name, keyword);
    });

    test("Should return '10' products in 'page 1' when 'service.getAll' is called with 13 products in database", async () => {
      // Arrange
      const { req, res, next } = createMockExpressContext();
      const mockProducts = generateMockSelectProducts({ count: 13 });
      await Product.insertMany(mockProducts);
      req.query = { currentPage: "1" };

      // Act
      await controller.getAll(req, res, next);

      // Assert
      const response = res._getJSONData();
      assert.ok(response);
      assert.ok(response.data);
      assert.strictEqual(response.data.length, 10);
      assert.strictEqual(response.meta.currentPage, 1);
      assert.strictEqual(response.meta.numberOfPages, 2);
    });

    test("Should return '3' products in 'page 2' when 'service.getAll' is called with 13 products in database", async () => {
      // Arrange
      const { req, res, next } = createMockExpressContext();
      const mockProducts = generateMockSelectProducts({ count: 13 });
      await Product.insertMany(mockProducts);
      req.query = { currentPage: "2" };

      // Act
      await controller.getAll(req, res, next);

      // Assert
      const response = res._getJSONData();
      assert.ok(response);
      assert.ok(response.data);
      assert.strictEqual(response.data.length, 3);
      assert.strictEqual(response.meta.currentPage, 2);
      assert.strictEqual(response.meta.numberOfPages, 2);
    });

    test("Should return 'empty array' when 'service.getAll' is called with no products in database", async () => {
      // Arrange
      const { req, res, next } = createMockExpressContext();

      // Act
      await controller.getAll(req, res, next);

      // Assert
      const response = res._getJSONData();
      assert.ok(response);
      assert.ok(response.data);
      assert.strictEqual(response.data.length, 0);
    });

    test("Should throw 'ZodError' when 'service.getAll' is called with invalid 'currentPage' query", async () => {
      // Arrange
      const { req, res, next } = createMockExpressContext();
      req.query = { currentPage: "invalid-number" };

      // Act & Assert
      await assert.rejects(
        async () => await controller.getAll(req, res, next),
        (error: unknown) => {
          assert.ok(error instanceof ZodError);
          assert.strictEqual(error.errors.length, 1);
          assert.strictEqual(error.errors[0].path.length, 1);
          assert.strictEqual(error.errors[0].path[0], "currentPage");
          return true;
        },
      );
    });
  });

  describe("getTopRated", () => {
    test("Should return success response when 'service.getTopRated' is called with valid data", async () => {
      // Arrange
      const { req, res, next } = createMockExpressContext();
      const mockProducts = generateMockSelectProducts({ count: 3 });
      await Product.insertMany(mockProducts);

      // Act
      await controller.getTopRated(req, res, next);

      // Assert
      const response = res._getJSONData();
      assert.ok(response);
      assert.ok(response.success);
      assert.ok(response.data);
      assert.strictEqual(response.data.length, mockProducts.length);
    });

    test("Should return '200' status code when 'service.getTopRated' is called with valid data", async () => {
      // Arrange
      const { req, res, next } = createMockExpressContext();
      const mockProducts = generateMockSelectProducts({ count: 3 });
      await Product.insertMany(mockProducts);

      // Act
      await controller.getTopRated(req, res, next);

      // Assert
      const code = res._getStatusCode();
      assert.strictEqual(code, 200);
    });

    test("Should return array of top rated products when 'service.getTopRated' is called with valid data", async () => {
      // Arrange
      const { req, res, next } = createMockExpressContext();
      const mockProducts = generateMockSelectProducts({ count: 3 });
      await Product.insertMany(mockProducts);

      // Act
      await controller.getTopRated(req, res, next);

      // Assert
      const response = res._getJSONData();
      assert.ok(response);
      assert.ok(response.data);
      assert.ok(Array.isArray(response.data));
      assert.strictEqual(response.data.length, mockProducts.length);
    });

    test("Should return 'empty array' when 'service.getTopRated' is called with no products in database", async () => {
      // Arrange
      const { req, res, next } = createMockExpressContext();

      // Act
      await controller.getTopRated(req, res, next);

      // Assert
      const response = res._getJSONData();
      assert.ok(response);
      assert.strictEqual(response.data.length, 0);
    });
  });

  describe("getById", () => {
    test("Should return success response when 'service.getById' is called with valid data", async () => {
      // Arrange
      const { req, res, next } = createMockExpressContext();
      const mockProduct = generateMockSelectProduct();
      await Product.insertMany([mockProduct]);

      req.params = { productId: mockProduct._id.toString() };

      // Act
      await controller.getById(req, res, next);

      // Assert
      const response = res._getJSONData();
      assert.ok(response);
      assert.ok(response.success);
      assert.ok(response.data);
    });

    test("Should return '200' status code when 'service.getById' is called with valid data", async () => {
      // Arrange
      const { req, res, next } = createMockExpressContext();
      const mockProduct = generateMockSelectProduct();
      await Product.insertMany([mockProduct]);
      req.params = { productId: mockProduct._id.toString() };

      // Act
      await controller.getById(req, res, next);

      // Assert
      const code = res._getStatusCode();
      assert.strictEqual(code, 200);
    });

    test("Should return product object when 'service.getById' is called with existing product", async () => {
      // Arrange
      const { req, res, next } = createMockExpressContext();
      const mockProduct = generateMockSelectProduct();
      await Product.insertMany([mockProduct]);
      req.params = { productId: mockProduct._id.toString() };

      // Act
      await controller.getById(req, res, next);

      // Assert
      const response = res._getJSONData();
      assert.ok(response);
      assert.ok(response.data);
      assert.strictEqual(response.data.name, mockProduct.name);
      assert.strictEqual(response.data.brand, mockProduct.brand);
      assert.strictEqual(response.data.category, mockProduct.category);
      assert.strictEqual(response.data.description, mockProduct.description);
      assert.strictEqual(response.data.price, mockProduct.price);
      assert.strictEqual(response.data.countInStock, mockProduct.countInStock);
      assert.strictEqual(response.data.image, mockProduct.image);
      assert.strictEqual(response.data.rating, mockProduct.rating);
      assert.strictEqual(response.data.numReviews, mockProduct.numReviews);
    });

    test("Should throw 'NotFoundError' when 'service.getById' is called with non-existent product id", async () => {
      // Arrange
      const { req, res, next } = createMockExpressContext();
      const productId = generateMockObjectId();
      req.params = { productId: productId.toString() };

      // Act & Assert
      await assert.rejects(
        async () => await controller.getById(req, res, next),
        NotFoundError,
      );
    });

    test("Should throw 'ZodError' when 'service.getById' is called with invalid 'objectId' in params", async () => {
      // Arrange
      const { req, res, next } = createMockExpressContext();
      req.params = { productId: "invalid-id" };

      // Act & Assert
      await assert.rejects(
        async () => await controller.getById(req, res, next),
        (error: unknown) => {
          assert.ok(error instanceof ZodError);
          assert.strictEqual(error.errors.length, 1);
          assert.strictEqual(
            error.errors[0].message,
            "Invalid ObjectId format.",
          );
          return true;
        },
      );
    });
  });

  describe("update", () => {
    test("Should return success response when 'service.update' is called with valid data", async () => {
      // Arrange
      const { req, res, next } = createMockExpressContext();
      const mockProduct = generateMockSelectProduct();
      req.params = { productId: mockProduct._id.toString() };

      await Product.insertMany([mockProduct]);
      cache.set({ key: mockProduct._id.toString(), value: mockProduct });

      // Act
      await controller.update(req, res, next);

      // Assert
      const response = res._getJSONData();
      assert.ok(response);
      assert.ok(response.success);
      assert.ok(response.data);
    });

    test("Should return '200' status code when 'service.update' is called with valid data", async () => {
      // Arrange
      const { req, res, next } = createMockExpressContext();
      const mockProduct = generateMockSelectProduct();
      req.params = { productId: mockProduct._id.toString() };

      await Product.insertMany([mockProduct]);
      cache.set({ key: mockProduct._id.toString(), value: mockProduct });

      // Act
      await controller.update(req, res, next);

      // Assert
      const code = res._getStatusCode();
      assert.strictEqual(code, 200);
    });

    test("Should return updated product when 'service.update' is called with valid update data", async () => {
      // Arrange
      const { req, res, next } = createMockExpressContext();
      const mockProduct = generateMockSelectProduct();
      const updateData: Partial<InsertProduct> = { name: "UPDATED NAME" };

      req.params = { productId: mockProduct._id.toString() };
      req.body = updateData;

      await Product.insertMany([mockProduct]);
      cache.set({ key: mockProduct._id.toString(), value: mockProduct });

      // Act
      await controller.update(req, res, next);

      // Assert
      const response = res._getJSONData();
      assert.ok(response);
      assert.strictEqual(response.data.name, updateData.name);
    });

    test("Should throw 'NotFoundError' when 'service.update' is called with non-existent product id", async () => {
      // Arrange
      const { req, res, next } = createMockExpressContext();
      const productId = generateMockObjectId().toString();
      req.params = { productId: productId };

      // Act & Assert
      await assert.rejects(
        async () => await controller.update(req, res, next),
        NotFoundError,
      );
    });

    test("Should throw 'ZodError' when 'service.update' is called with invalid 'objectId' in params", async () => {
      // Arrange
      const { req, res, next } = createMockExpressContext();
      const productId = "invalid-id";
      req.params = { productId: productId };

      // Act & Assert
      await assert.rejects(
        async () => await controller.update(req, res, next),
        (error: unknown) => {
          assert.ok(error instanceof ZodError);
          assert.strictEqual(error.errors.length, 1);
          assert.strictEqual(
            error.errors[0].message,
            "Invalid ObjectId format.",
          );
          return true;
        },
      );
    });
  });

  describe("delete", () => {
    test("Should return success response when 'service.delete' is called with valid data", async () => {
      // Arrange
      const { req, res, next } = createMockExpressContext();
      const mockProduct = generateMockSelectProduct();
      req.params = { productId: mockProduct._id.toString() };

      await Product.insertMany([mockProduct]);
      cache.set({ key: mockProduct._id.toString(), value: mockProduct });

      // Act
      await controller.delete(req, res, next);

      // Assert
      const response = res._getJSONData();
      assert.ok(response);
      assert.ok(response.success);
    });

    test("Should return '204' status code when 'service.delete' is called with valid data", async () => {
      // Arrange
      const { req, res, next } = createMockExpressContext();
      const mockProduct = generateMockSelectProduct();
      req.params = { productId: mockProduct._id.toString() };

      await Product.insertMany([mockProduct]);
      cache.set({ key: mockProduct._id.toString(), value: mockProduct });

      // Act
      await controller.delete(req, res, next);

      // Assert
      const code = res._getStatusCode();
      assert.strictEqual(code, 204);
    });

    test("Should return 'data' equals to 'null' 'service.delete' is called with valid data", async () => {
      // Arrange
      const { req, res, next } = createMockExpressContext();
      const mockProduct = generateMockSelectProduct();
      req.params = { productId: mockProduct._id.toString() };

      await Product.insertMany([mockProduct]);
      cache.set({ key: mockProduct._id.toString(), value: mockProduct });

      // Act
      await controller.delete(req, res, next);

      // Assert
      const response = res._getJSONData();
      assert.ok(response);
      assert.strictEqual(response.data, null);
    });

    test("Should throw 'NotFoundError' when 'service.delete' is called with non-existent product id", async () => {
      // Arrange
      const { req, res, next } = createMockExpressContext();
      const productId = generateMockObjectId().toString();
      req.params = { productId: productId };

      // Act & Assert
      await assert.rejects(
        async () => await controller.delete(req, res, next),
        NotFoundError,
      );
    });

    test("Should throw 'ZodError' when 'service.delete' is called with invalid 'objectId' in params", async () => {
      // Arrange
      const { req, res, next } = createMockExpressContext();
      req.params = { productId: "invalid-id" };

      // Act & Assert
      await assert.rejects(
        async () => await controller.delete(req, res, next),
        (error: unknown) => {
          assert.ok(error instanceof ZodError);
          assert.strictEqual(error.errors.length, 1);
          assert.strictEqual(
            error.errors[0].message,
            "Invalid ObjectId format.",
          );
          return true;
        },
      );
    });
  });
});
