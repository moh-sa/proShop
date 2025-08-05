import mongoose from "mongoose";
import assert from "node:assert";
import test, { beforeEach, describe, mock, suite } from "node:test";
import {
  DatabaseNetworkError,
  DatabaseQueryError,
  DatabaseTimeoutError,
  DatabaseValidationError,
  GenericDatabaseError,
} from "../../errors";
import { CacheManager } from "../../managers";
import Product from "../../models/productModel";
import { ProductRepository } from "../../repositories";
import { InsertProductWithStringImage } from "../../types";
import {
  generateMockInsertProductWithStringImage,
  generateMockSelectProduct,
  generateMockSelectProducts,
  mockCacheHit,
  mockCacheInvalidation,
  mockCacheManager,
  mockCacheMiss,
  mockSetCache,
} from "../mocks";

suite("Product Repository 〖 Unit Tests 〗", () => {
  const mockCache = mockCacheManager();
  const repo = new ProductRepository(
    Product,
    mockCache as unknown as CacheManager,
  );

  beforeEach(() => mockCache.reset());

  describe("create", () => {
    const mockInsertProduct = generateMockInsertProductWithStringImage();
    const mockSelectProduct = {
      ...generateMockSelectProduct(),
      ...mockInsertProduct,
    };
    const productId = mockSelectProduct._id;
    const cacheKey = productId.toString();

    test("Should return product object when 'db.create' is called once with product data", async () => {
      const mockCreate = mock.method(Product, "create", async () => ({
        toObject: () => mockSelectProduct,
      }));

      mockSetCache({ instance: mockCache, cacheKey });

      const product = await repo.create(mockInsertProduct);

      assert.ok(product);
      assert.deepStrictEqual(product, mockSelectProduct);

      assert.strictEqual(mockCreate.mock.callCount(), 1);
      assert.deepStrictEqual(
        mockCreate.mock.calls[0].arguments[0],
        mockInsertProduct,
      );
    });

    test("Should return product object when 'cache.get' is called once and returns 'true'", async () => {
      mock.method(Product, "create", async () => ({
        toObject: () => mockSelectProduct,
      }));

      mockSetCache({ instance: mockCache, cacheKey });

      await repo.create(mockInsertProduct);

      assert.strictEqual(mockCache.set.mock.callCount(), 1);
      assert.deepStrictEqual(mockCache.set.mock.calls[0].arguments[0], {
        key: cacheKey,
        value: mockSelectProduct,
      });
    });

    test("Should throw 'DatabaseValidationError' when 'db.create' throws 'ValidationError'", async (t) => {
      const validationError = new mongoose.Error.ValidationError();

      t.mock.method(Product, "create", () => {
        throw validationError;
      });

      await assert.rejects(
        async () => await repo.create(mockInsertProduct),
        DatabaseValidationError,
      );
    });

    test("Should throw 'DatabaseTimeoutError' when 'db.create' throws 'MongoNetworkTimeoutError'", async (t) => {
      const timeoutError = new mongoose.mongo.MongoNetworkTimeoutError(
        "Timeout",
      );

      t.mock.method(Product, "create", () => {
        throw timeoutError;
      });

      await assert.rejects(
        async () => await repo.create(mockInsertProduct),
        DatabaseTimeoutError,
      );
    });

    test("Should throw 'DatabaseQueryError' when 'db.create' throws 'MongooseError'", async (t) => {
      const queryError = new mongoose.Error("Query failed");

      t.mock.method(Product, "create", () => {
        throw queryError;
      });

      await assert.rejects(
        async () => await repo.create(mockInsertProduct),
        DatabaseQueryError,
      );
    });

    test("Should throw 'DatabaseNetworkError' when 'db.create' throws 'MongoError'", async (t) => {
      const networkError = new mongoose.mongo.MongoError("Network error");

      t.mock.method(Product, "create", () => {
        throw networkError;
      });

      await assert.rejects(
        async () => await repo.create(mockInsertProduct),
        DatabaseNetworkError,
      );
    });

    test("Should throw 'GenericDatabaseError' when 'db.create' throws unknown error", async (t) => {
      const unknownError = new Error("Something unexpected happened");

      t.mock.method(Product, "create", () => {
        throw unknownError;
      });

      await assert.rejects(
        async () => await repo.create(mockInsertProduct),
        GenericDatabaseError,
      );
    });
  });

  describe("getAll", () => {
    const cacheKey = "all-1";
    const mockProducts = generateMockSelectProducts({ count: 8 });

    test("Should return array of products when 'db.find' is called once with no args", async (t) => {
      const mockFind = t.mock.method(Product, "find", () => ({
        select: () => ({
          limit: () => ({
            skip: () => ({
              lean: () => mockProducts,
            }),
          }),
        }),
      }));

      mockCacheMiss({
        instance: mockCache,
        cacheKey,
      });

      const products = await repo.getAll({
        query: {},
        numberOfProductsPerPage: 10,
        currentPage: 1,
      });

      assert.ok(products);
      assert.deepStrictEqual(products, mockProducts);

      assert.strictEqual(mockFind.mock.callCount(), 1);
      assert.deepStrictEqual(mockFind.mock.calls[0].arguments[0], {});
    });

    test("Should return array of products when 'cache.get' is called once and returns 'undefined'", async (t) => {
      mockCacheMiss({
        instance: mockCache,
        cacheKey,
      });

      t.mock.method(Product, "find", () => ({
        select: () => ({
          limit: () => ({
            skip: () => ({
              lean: () => mockProducts,
            }),
          }),
        }),
      }));

      await repo.getAll({
        query: {},
        numberOfProductsPerPage: 10,
        currentPage: 1,
      });

      assert.strictEqual(mockCache.get.mock.callCount(), 1);
      assert.deepStrictEqual(mockCache.get.mock.calls[0].arguments[0], {
        key: cacheKey,
      });
    });

    test("Should return array of products when 'cache.get' is called once and returns value", async () => {
      mockCacheHit({
        instance: mockCache,
        cacheKey,
        returnValue: mockProducts,
      });

      const products = await repo.getAll({
        query: {},
        numberOfProductsPerPage: 10,
        currentPage: 1,
      });

      assert.ok(products);

      assert.deepStrictEqual(products, mockProducts);

      assert.strictEqual(mockCache.get.mock.callCount(), 1);
      assert.deepStrictEqual(mockCache.get.mock.calls[0].arguments[0], {
        key: cacheKey,
      });
    });

    test("Should return empty array when 'db.find' returns empty array", async (t) => {
      mockCacheMiss({ instance: mockCache, cacheKey });

      t.mock.method(Product, "find", () => ({
        select: () => ({
          limit: () => ({
            skip: () => ({
              lean: () => [],
            }),
          }),
        }),
      }));

      const products = await repo.getAll({
        query: {},
        numberOfProductsPerPage: 10,
        currentPage: 1,
      });

      assert.ok(products);
      assert.strictEqual(products.length, 0);
    });

    test("Should throw 'DatabaseValidationError' when 'db.find' throws 'ValidationError'", async (t) => {
      const validationError = new mongoose.Error.ValidationError();

      t.mock.method(Product, "find", () => {
        throw validationError;
      });

      mockCacheMiss({ instance: mockCache, cacheKey });

      await assert.rejects(
        async () =>
          await repo.getAll({
            query: {},
            numberOfProductsPerPage: 10,
            currentPage: 1,
          }),
        DatabaseValidationError,
      );
    });

    test("Should throw 'DatabaseTimeoutError' when 'db.find' throws 'MongoNetworkTimeoutError'", async (t) => {
      const timeoutError = new mongoose.mongo.MongoNetworkTimeoutError(
        "Timeout",
      );

      t.mock.method(Product, "find", () => {
        throw timeoutError;
      });

      mockCacheMiss({ instance: mockCache, cacheKey });

      await assert.rejects(
        async () =>
          await repo.getAll({
            query: {},
            numberOfProductsPerPage: 10,
            currentPage: 1,
          }),
        DatabaseTimeoutError,
      );
    });

    test("Should throw 'DatabaseQueryError' when 'db.find' throws 'MongooseError'", async (t) => {
      const queryError = new mongoose.Error("Query failed");

      t.mock.method(Product, "find", () => {
        throw queryError;
      });

      mockCacheMiss({ instance: mockCache, cacheKey });

      await assert.rejects(
        async () =>
          await repo.getAll({
            query: {},
            numberOfProductsPerPage: 10,
            currentPage: 1,
          }),
        DatabaseQueryError,
      );
    });

    test("Should throw 'DatabaseNetworkError' when 'db.find' throws 'MongoError'", async (t) => {
      const networkError = new mongoose.mongo.MongoError("Network error");

      t.mock.method(Product, "find", () => {
        throw networkError;
      });

      mockCacheMiss({ instance: mockCache, cacheKey });

      await assert.rejects(
        async () =>
          await repo.getAll({
            query: {},
            numberOfProductsPerPage: 10,
            currentPage: 1,
          }),
        DatabaseNetworkError,
      );
    });

    test("Should throw 'GenericDatabaseError' when 'db.find' throws unknown error", async (t) => {
      const unknownError = new Error("Something unexpected happened");

      t.mock.method(Product, "find", () => {
        throw unknownError;
      });

      mockCacheMiss({ instance: mockCache, cacheKey });

      await assert.rejects(
        async () =>
          await repo.getAll({
            query: {},
            numberOfProductsPerPage: 10,
            currentPage: 1,
          }),
        GenericDatabaseError,
      );
    });
  });

  describe("getById", () => {
    const mockProduct = generateMockSelectProduct();
    const productId = mockProduct._id;
    const cacheKey = productId.toString();

    test("Should return product object when 'db.findById' is called once with 'productId'", async (t) => {
      mockCacheMiss({
        instance: mockCache,
        cacheKey,
      });

      const mockFindById = t.mock.method(Product, "findById", () => ({
        lean: () => mockProduct,
      }));

      const product = await repo.getById({ productId: mockProduct._id });

      assert.ok(product);
      assert.deepStrictEqual(product, mockProduct);

      assert.strictEqual(mockFindById.mock.callCount(), 1);
      assert.deepStrictEqual(
        mockFindById.mock.calls[0].arguments[0],
        mockProduct._id,
      );
    });

    test("Should return product object when 'cache.get' is called once and returns 'undefined'", async (t) => {
      mockCacheMiss({
        instance: mockCache,
        cacheKey,
      });

      t.mock.method(Product, "findById", () => ({
        lean: () => mockProduct,
      }));

      await repo.getById({ productId: mockProduct._id });

      assert.strictEqual(mockCache.get.mock.callCount(), 1);
      assert.deepStrictEqual(mockCache.get.mock.calls[0].arguments[0], {
        key: cacheKey,
      });
    });

    test("Should return product object when 'cache.get' is called once and returns value", async () => {
      mockCacheHit({
        instance: mockCache,
        cacheKey,
        returnValue: mockProduct,
      });

      const product = await repo.getById({ productId: mockProduct._id });

      assert.ok(product);
      assert.deepStrictEqual(product, mockProduct);

      assert.strictEqual(mockCache.get.mock.callCount(), 1);
      assert.deepStrictEqual(mockCache.get.mock.calls[0].arguments[0], {
        key: cacheKey,
      });
    });

    test("Should return 'null' when 'db.findById' returns 'null'", async (t) => {
      mockCacheMiss({ instance: mockCache, cacheKey });

      const mockFindById = t.mock.method(Product, "findById", () => ({
        lean: () => null,
      }));

      const product = await repo.getById({ productId: mockProduct._id });

      assert.strictEqual(product, null);

      assert.strictEqual(mockFindById.mock.callCount(), 1);
      assert.deepStrictEqual(
        mockFindById.mock.calls[0].arguments[0],
        mockProduct._id,
      );
    });

    test("Should throw 'DatabaseValidationError' when 'db.findById' throws 'ValidationError'", async (t) => {
      const validationError = new mongoose.Error.ValidationError();

      t.mock.method(Product, "findById", () => {
        throw validationError;
      });

      mockCacheMiss({ instance: mockCache, cacheKey });

      await assert.rejects(
        async () => await repo.getById({ productId: mockProduct._id }),
        DatabaseValidationError,
      );
    });

    test("Should throw 'DatabaseTimeoutError' when 'db.findById' throws 'MongoNetworkTimeoutError'", async (t) => {
      const timeoutError = new mongoose.mongo.MongoNetworkTimeoutError(
        "Timeout",
      );

      t.mock.method(Product, "findById", () => {
        throw timeoutError;
      });

      mockCacheMiss({ instance: mockCache, cacheKey });

      await assert.rejects(
        async () => await repo.getById({ productId: mockProduct._id }),
        DatabaseTimeoutError,
      );
    });

    test("Should throw 'DatabaseQueryError' when 'db.findById' throws 'MongooseError'", async (t) => {
      const queryError = new mongoose.Error("Query failed");

      t.mock.method(Product, "findById", () => {
        throw queryError;
      });

      mockCacheMiss({ instance: mockCache, cacheKey });

      await assert.rejects(
        async () => await repo.getById({ productId: mockProduct._id }),
        DatabaseQueryError,
      );
    });

    test("Should throw 'DatabaseNetworkError' when 'db.findById' throws 'MongoError'", async (t) => {
      const networkError = new mongoose.mongo.MongoError("Network error");

      t.mock.method(Product, "findById", () => {
        throw networkError;
      });

      mockCacheMiss({ instance: mockCache, cacheKey });

      await assert.rejects(
        async () => await repo.getById({ productId: mockProduct._id }),
        DatabaseNetworkError,
      );
    });

    test("Should throw 'GenericDatabaseError' when 'db.findById' throws unknown error", async (t) => {
      const unknownError = new Error("Something unexpected happened");

      t.mock.method(Product, "findById", () => {
        throw unknownError;
      });

      mockCacheMiss({ instance: mockCache, cacheKey });

      await assert.rejects(
        async () => await repo.getById({ productId: mockProduct._id }),
        GenericDatabaseError,
      );
    });
  });

  describe("getTopRated", () => {
    const mockProducts = generateMockSelectProducts({ count: 3 });
    const cacheKey = "top-rated";
    const limit = 3;

    test("Should return array of products when 'db.find' is called once with no args", async (t) => {
      mockCacheMiss({
        instance: mockCache,
        cacheKey,
      });

      const mockFind = t.mock.method(Product, "find", () => ({
        select: () => ({
          sort: () => ({
            limit: () => ({
              lean: () => mockProducts,
            }),
          }),
        }),
      }));

      const products = await repo.getTopRated({ limit });

      assert.ok(products);
      assert.deepStrictEqual(products, mockProducts);

      assert.strictEqual(mockFind.mock.callCount(), 1);
      assert.deepStrictEqual(mockFind.mock.calls[0].arguments[0], {});
    });

    test("Should return array of products when 'cache.get' is called once and returns 'undefined'", async (t) => {
      mockCacheMiss({
        instance: mockCache,
        cacheKey,
      });

      t.mock.method(Product, "find", () => ({
        select: () => ({
          sort: () => ({
            limit: () => ({
              lean: () => mockProducts,
            }),
          }),
        }),
      }));

      await repo.getTopRated({ limit });

      assert.strictEqual(mockCache.get.mock.callCount(), 1);
      assert.deepStrictEqual(mockCache.get.mock.calls[0].arguments[0], {
        key: cacheKey,
      });
    });

    test("Should return array of products when 'cache.get' is called once and returns value", async () => {
      mockCacheHit({
        cacheKey,
        instance: mockCache,
        returnValue: mockProducts,
      });

      const products = await repo.getTopRated({ limit });

      assert.ok(products);
      assert.deepStrictEqual(products, mockProducts);

      assert.strictEqual(mockCache.get.mock.callCount(), 1);
      assert.deepStrictEqual(mockCache.get.mock.calls[0].arguments[0], {
        key: cacheKey,
      });
    });

    test("Should return empty array when 'db.find' is called once and returns empty array", async (t) => {
      mockCacheMiss({ instance: mockCache, cacheKey });

      t.mock.method(Product, "find", () => ({
        select: () => ({
          sort: () => ({
            limit: () => ({
              lean: () => [],
            }),
          }),
        }),
      }));

      const products = await repo.getTopRated({ limit });

      assert.ok(products);
      assert.strictEqual(products.length, 0);
    });

    test("Should throw 'DatabaseValidationError' when 'db.find' throws 'ValidationError'", async (t) => {
      const validationError = new mongoose.Error.ValidationError();

      t.mock.method(Product, "find", () => {
        throw validationError;
      });

      mockCacheMiss({ instance: mockCache, cacheKey });

      await assert.rejects(
        async () => await repo.getTopRated({ limit }),
        DatabaseValidationError,
      );
    });

    test("Should throw 'DatabaseTimeoutError' when 'db.find' throws 'MongoNetworkTimeoutError'", async (t) => {
      const timeoutError = new mongoose.mongo.MongoNetworkTimeoutError(
        "Timeout",
      );

      t.mock.method(Product, "find", () => {
        throw timeoutError;
      });

      mockCacheMiss({ instance: mockCache, cacheKey });

      await assert.rejects(
        async () => await repo.getTopRated({ limit }),
        DatabaseTimeoutError,
      );
    });

    test("Should throw 'DatabaseQueryError' when 'db.find' throws 'MongooseError'", async (t) => {
      const queryError = new mongoose.Error("Query failed");

      t.mock.method(Product, "find", () => {
        throw queryError;
      });

      mockCacheMiss({ instance: mockCache, cacheKey });

      await assert.rejects(
        async () => await repo.getTopRated({ limit }),
        DatabaseQueryError,
      );
    });

    test("Should throw 'DatabaseNetworkError' when 'db.find' throws 'MongoError'", async (t) => {
      const networkError = new mongoose.mongo.MongoError("Network error");

      t.mock.method(Product, "find", () => {
        throw networkError;
      });

      mockCacheMiss({ instance: mockCache, cacheKey });

      await assert.rejects(
        async () => await repo.getTopRated({ limit }),
        DatabaseNetworkError,
      );
    });

    test("Should throw 'GenericDatabaseError' when 'db.find' throws unknown error", async (t) => {
      const unknownError = new Error("Something unexpected happened");

      t.mock.method(Product, "find", () => {
        throw unknownError;
      });

      mockCacheMiss({ instance: mockCache, cacheKey });

      await assert.rejects(
        async () => await repo.getTopRated({ limit }),
        GenericDatabaseError,
      );
    });
  });

  describe("update", () => {
    const mockProduct = generateMockSelectProduct();
    const productId = mockProduct._id;
    const updateData: Partial<InsertProductWithStringImage> = {
      name: "UPDATED PRODUCT NAME",
    };
    const expectedResult = { ...mockProduct, ...updateData };

    const cacheKey = productId.toString();

    test("Should return product object when 'db.findByIdAndUpdate' is called once  with 'productId' and 'data'", async (t) => {
      mockCacheInvalidation({
        instance: mockCache,
        cacheKey,
      });

      const mockFindByIdAndUpdate = t.mock.method(
        Product,
        "findByIdAndUpdate",
        () => ({
          lean: () => expectedResult,
        }),
      );

      const updatedProduct = await repo.update({
        productId: mockProduct._id,
        data: updateData,
      });

      assert.ok(updatedProduct);
      assert.deepStrictEqual(updatedProduct, expectedResult);

      assert.strictEqual(mockFindByIdAndUpdate.mock.callCount(), 1);
      assert.deepStrictEqual(
        mockFindByIdAndUpdate.mock.calls[0].arguments[0],
        mockProduct._id,
      );
      assert.deepStrictEqual(
        mockFindByIdAndUpdate.mock.calls[0].arguments[1],
        updateData,
      );
    });

    test("Should call 'cache.delete' and 'cache.stats' once with the correct 'cacheKey'", async (t) => {
      mockCacheInvalidation({
        instance: mockCache,
        cacheKey,
      });

      t.mock.method(Product, "findByIdAndUpdate", () => ({
        lean: () => expectedResult,
      }));

      await repo.update({
        productId: mockProduct._id,
        data: updateData,
      });

      assert.strictEqual(mockCache.delete.mock.callCount(), 1);
      assert.deepStrictEqual(mockCache.delete.mock.calls[0].arguments[0], {
        key: cacheKey,
      });

      assert.strictEqual(mockCache.getStats.mock.callCount(), 1);
      assert.strictEqual(mockCache.getStats.mock.calls[0].arguments.length, 0);
    });

    test("Should return 'null' when 'db.findByIdAndUpdate' returns 'null'", async (t) => {
      t.mock.method(Product, "findByIdAndUpdate", () => ({
        lean: () => null,
      }));

      const updatedProduct = await repo.update({
        productId,
        data: updateData,
      });

      assert.strictEqual(updatedProduct, null);
    });

    test("Should throw 'DatabaseValidationError' when 'db.findByIdAndUpdate' throws 'ValidationError'", async (t) => {
      const validationError = new mongoose.Error.ValidationError();

      t.mock.method(Product, "findByIdAndUpdate", () => {
        throw validationError;
      });

      await assert.rejects(
        async () =>
          await repo.update({
            productId,
            data: updateData,
          }),
        DatabaseValidationError,
      );
    });

    test("Should throw 'DatabaseTimeoutError' when 'db.findByIdAndUpdate' throws 'MongoNetworkTimeoutError'", async (t) => {
      const timeoutError = new mongoose.mongo.MongoNetworkTimeoutError(
        "Timeout",
      );

      t.mock.method(Product, "findByIdAndUpdate", () => {
        throw timeoutError;
      });

      await assert.rejects(
        async () =>
          await repo.update({
            productId,
            data: updateData,
          }),
        DatabaseTimeoutError,
      );
    });

    test("Should throw 'DatabaseQueryError' when 'db.findByIdAndUpdate' throws 'MongooseError'", async (t) => {
      const queryError = new mongoose.Error("Query failed");

      t.mock.method(Product, "findByIdAndUpdate", () => {
        throw queryError;
      });

      await assert.rejects(
        async () =>
          await repo.update({
            productId,
            data: updateData,
          }),
        DatabaseQueryError,
      );
    });

    test("Should throw 'DatabaseNetworkError' when 'db.findByIdAndUpdate' throws 'MongoError'", async (t) => {
      const networkError = new mongoose.mongo.MongoError("Network error");

      t.mock.method(Product, "findByIdAndUpdate", () => {
        throw networkError;
      });

      await assert.rejects(
        async () =>
          await repo.update({
            productId,
            data: updateData,
          }),
        DatabaseNetworkError,
      );
    });

    test("Should throw 'GenericDatabaseError' when 'db.findByIdAndUpdate' throws unknown error", async (t) => {
      const unknownError = new Error("Something unexpected happened");

      t.mock.method(Product, "findByIdAndUpdate", () => {
        throw unknownError;
      });

      await assert.rejects(
        async () =>
          await repo.update({
            productId,
            data: updateData,
          }),
        GenericDatabaseError,
      );
    });
  });

  describe("Delete Product", () => {
    const mockProduct = generateMockSelectProduct();
    const productId = mockProduct._id;

    const cacheKey = productId.toString();

    test("Should return product object when 'db.findByIdAndDelete' is called once", async (t) => {
      mockCacheInvalidation({
        instance: mockCache,
        cacheKey,
      });

      const mockFindByIdAndDelete = t.mock.method(
        Product,
        "findByIdAndDelete",
        () => ({
          lean: () => mockProduct,
        }),
      );

      const deletedProduct = await repo.delete({ productId });

      assert.ok(deletedProduct);
      assert.deepStrictEqual(deletedProduct, mockProduct);

      assert.strictEqual(mockFindByIdAndDelete.mock.callCount(), 1);
      assert.deepStrictEqual(
        mockFindByIdAndDelete.mock.calls[0].arguments[0],
        productId,
      );
    });

    test("Should call 'cache.delete' and 'cache.stats' once with the correct 'cacheKey'", async (t) => {
      mockCacheInvalidation({
        instance: mockCache,
        cacheKey,
      });

      t.mock.method(Product, "findByIdAndDelete", () => ({
        lean: () => mockProduct,
      }));

      await repo.delete({ productId });

      assert.strictEqual(mockCache.delete.mock.callCount(), 1);
      assert.deepStrictEqual(mockCache.delete.mock.calls[0].arguments[0], {
        key: cacheKey,
      });

      assert.strictEqual(mockCache.getStats.mock.callCount(), 1);
      assert.strictEqual(mockCache.getStats.mock.calls[0].arguments.length, 0);
    });

    test("Should return 'null' when 'db.findByIdAndDelete' returns 'null'", async (t) => {
      t.mock.method(Product, "findByIdAndDelete", () => ({
        lean: async () => null,
      }));

      const deletedProduct = await repo.delete({ productId });

      assert.strictEqual(deletedProduct, null);
    });

    test("Should throw 'DatabaseValidationError' when 'db.findByIdAndDelete' throws 'ValidationError'", async (t) => {
      const validationError = new mongoose.Error.ValidationError();

      t.mock.method(Product, "findByIdAndDelete", () => {
        throw validationError;
      });

      await assert.rejects(
        async () => await repo.delete({ productId }),
        DatabaseValidationError,
      );
    });

    test("Should throw 'DatabaseTimeoutError' when 'db.findByIdAndDelete' throws 'MongoNetworkTimeoutError'", async (t) => {
      const timeoutError = new mongoose.mongo.MongoNetworkTimeoutError(
        "Timeout",
      );

      t.mock.method(Product, "findByIdAndDelete", () => {
        throw timeoutError;
      });

      await assert.rejects(
        async () => await repo.delete({ productId }),
        DatabaseTimeoutError,
      );
    });

    test("Should throw 'DatabaseQueryError' when 'db.findByIdAndDelete' throws 'MongooseError'", async (t) => {
      const queryError = new mongoose.Error("Query failed");

      t.mock.method(Product, "findByIdAndDelete", () => {
        throw queryError;
      });

      await assert.rejects(
        async () => await repo.delete({ productId }),
        DatabaseQueryError,
      );
    });

    test("Should throw 'DatabaseNetworkError' when 'db.findByIdAndDelete' throws 'MongoError'", async (t) => {
      const networkError = new mongoose.mongo.MongoError("Network error");

      t.mock.method(Product, "findByIdAndDelete", () => {
        throw networkError;
      });

      await assert.rejects(
        async () => await repo.delete({ productId }),
        DatabaseNetworkError,
      );
    });

    test(
      "Should throw 'GenericDatabaseError' when 'db.findByIdAndDelete' throws unknown error",
      { skip: true },
      async (t) => {
        const unknownError = new Error("Something unexpected happened");

        t.mock.method(Product, "findByIdAndDelete", () => {
          throw unknownError;
        });

        await assert.rejects(
          async () => await repo.delete({ productId }),
          GenericDatabaseError,
        );
      },
    );
  });

  describe("count", () => {
    test("Should return the count as a number when 'db.countDocuments' is called once with no args", async (t) => {
      const mockCount = 10;

      const mockCountDocuments = t.mock.method(
        Product,
        "countDocuments",
        () => ({
          lean: () => mockCount,
        }),
      );

      const count = await repo.count({});

      assert.ok(count);
      assert.ok(typeof count === "number");
      assert.strictEqual(count, mockCount);

      assert.strictEqual(mockCountDocuments.mock.callCount(), 1);
      assert.deepStrictEqual(mockCountDocuments.mock.calls[0].arguments[0], {});
    });

    test("Should return '0' when 'db.countDocuments' returns '0'", async (t) => {
      const mockCount = 0;

      t.mock.method(Product, "countDocuments", () => ({
        lean: () => mockCount,
      }));

      const count = await repo.count({});

      assert.strictEqual(count, mockCount);
    });

    test("Should throw 'DatabaseValidationError' when 'db.countDocuments' throws 'ValidationError'", async (t) => {
      const validationError = new mongoose.Error.ValidationError();

      t.mock.method(Product, "countDocuments", () => {
        throw validationError;
      });

      await assert.rejects(
        async () => await repo.count({}),
        DatabaseValidationError,
      );
    });

    test("Should throw 'DatabaseTimeoutError' when 'db.countDocuments' throws 'MongoNetworkTimeoutError'", async (t) => {
      const timeoutError = new mongoose.mongo.MongoNetworkTimeoutError(
        "Timeout",
      );

      t.mock.method(Product, "countDocuments", () => {
        throw timeoutError;
      });

      await assert.rejects(
        async () => await repo.count({}),
        DatabaseTimeoutError,
      );
    });

    test("Should throw 'DatabaseQueryError' when 'db.countDocuments' throws 'MongooseError'", async (t) => {
      const queryError = new mongoose.Error("Query failed");

      t.mock.method(Product, "countDocuments", () => {
        throw queryError;
      });

      await assert.rejects(
        async () => await repo.count({}),
        DatabaseQueryError,
      );
    });

    test("Should throw 'DatabaseNetworkError' when 'db.countDocuments' throws 'MongoError'", async (t) => {
      const networkError = new mongoose.mongo.MongoError("Network error");

      t.mock.method(Product, "countDocuments", () => {
        throw networkError;
      });

      await assert.rejects(
        async () => await repo.count({}),
        DatabaseNetworkError,
      );
    });

    test("Should throw 'GenericDatabaseError' when 'db.countDocuments' throws unknown error", async (t) => {
      const unknownError = new Error("Something unexpected happened");

      t.mock.method(Product, "countDocuments", () => {
        throw unknownError;
      });

      await assert.rejects(
        async () => await repo.count({}),
        GenericDatabaseError,
      );
    });
  });
});
