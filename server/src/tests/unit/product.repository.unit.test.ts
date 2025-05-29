import mongoose from "mongoose";
import assert from "node:assert";
import test, { beforeEach, describe, mock, suite } from "node:test";
import { DatabaseError } from "../../errors";
import { CacheManager } from "../../managers";
import Product from "../../models/productModel";
import { ProductRepository } from "../../repositories";
import { InsertProductWithStringImage, Namespace } from "../../types";
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
  const cacheNamespace: Namespace = "product";
  const mockCache = mockCacheManager();
  const repo = new ProductRepository(
    Product,
    mockCache as unknown as CacheManager,
  );

  function generateCacheKey({ cacheId }: { cacheId: string }): string {
    return `${cacheNamespace}:${cacheId}`;
  }

  beforeEach(() => mockCache.reset());

  describe("create", () => {
    const mockInsertProduct = generateMockInsertProductWithStringImage();
    const mockSelectProduct = {
      ...generateMockSelectProduct(),
      ...mockInsertProduct,
    };
    const productId = mockSelectProduct._id;
    const cacheKey = generateCacheKey({
      cacheId: productId.toString(),
    });

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

      assert.strictEqual(mockCache.generateKey.mock.callCount(), 1);
      assert.deepStrictEqual(mockCache.generateKey.mock.calls[0].arguments[0], {
        id: productId.toString(),
      });

      assert.strictEqual(mockCache.set.mock.callCount(), 1);
      assert.deepStrictEqual(mockCache.set.mock.calls[0].arguments[0], {
        key: cacheKey,
        value: mockSelectProduct,
      });
    });

    test("Should throw 'DatabaseError' when 'db.create' throws Mongoose error", async (t) => {
      const mongooseError = new mongoose.Error.ValidationError();
      mongooseError.message = "Validation failed";

      t.mock.method(Product, "create", async () => {
        throw mongooseError;
      });

      await assert.rejects(
        async () => await repo.create(mockInsertProduct),
        (error: Error) => {
          assert.ok(error instanceof DatabaseError);
          assert.strictEqual(error.message, mongooseError.message);
          assert.strictEqual(error.statusCode, 500);
          return true;
        },
      );
    });

    test("Should throw generic 'DatabaseError' when 'db.create' throws unknown error", async (t) => {
      const unknownError = new Error("Something unexpected happened");

      t.mock.method(Product, "create", async () => {
        throw unknownError;
      });

      await assert.rejects(
        async () => await repo.create(mockInsertProduct),
        DatabaseError,
      );
    });
  });

  describe("getAll", () => {
    const cacheId = "all-1";
    const cacheKey = generateCacheKey({ cacheId });
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

      assert.strictEqual(mockCache.generateKey.mock.callCount(), 1);
      assert.deepStrictEqual(mockCache.generateKey.mock.calls[0].arguments[0], {
        id: cacheId,
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

      assert.strictEqual(mockCache.generateKey.mock.callCount(), 1);
      assert.deepStrictEqual(mockCache.generateKey.mock.calls[0].arguments[0], {
        id: cacheId,
      });

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

    test("Should throw 'DatabaseError' when 'db.find' throws Mongoose error", async (t) => {
      const mongooseError = new mongoose.Error.ValidationError();
      mongooseError.message = "Validation failed";

      t.mock.method(Product, "find", () => ({
        select: () => ({
          limit: () => ({
            skip: () => ({
              lean: () => {
                throw mongooseError;
              },
            }),
          }),
        }),
      }));

      await assert.rejects(
        async () =>
          await repo.getAll({
            query: {},
            numberOfProductsPerPage: 10,
            currentPage: 1,
          }),
        (error: Error) => {
          assert.ok(error instanceof DatabaseError);
          assert.strictEqual(error.message, mongooseError.message);
          assert.strictEqual(error.statusCode, 500);
          return true;
        },
      );
    });

    test("Should throw generic 'DatabaseError' when 'db.find' throws unknown error", async (t) => {
      const unknownError = new Error("Something unexpected happened");

      t.mock.method(Product, "find", () => ({
        select: () => ({
          limit: () => ({
            skip: () => ({
              lean: () => {
                throw unknownError;
              },
            }),
          }),
        }),
      }));

      await assert.rejects(
        async () =>
          await repo.getAll({
            query: {},
            numberOfProductsPerPage: 10,
            currentPage: 1,
          }),
        DatabaseError,
      );
    });
  });

  describe("getById", () => {
    const mockProduct = generateMockSelectProduct();
    const productId = mockProduct._id;
    const cacheId = productId.toString();
    const cacheKey = generateCacheKey({ cacheId });

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

      assert.strictEqual(mockCache.generateKey.mock.callCount(), 1);
      assert.deepStrictEqual(mockCache.generateKey.mock.calls[0].arguments[0], {
        id: cacheId,
      });

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

      assert.strictEqual(mockCache.generateKey.mock.callCount(), 1);
      assert.deepStrictEqual(mockCache.generateKey.mock.calls[0].arguments[0], {
        id: cacheId,
      });

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

    test("Should throw 'DatabaseError' when 'db.findById' throws Mongoose error", async (t) => {
      const mongooseError = new mongoose.Error.ValidationError();
      mongooseError.message = "Validation failed";

      mockCacheMiss({ instance: mockCache, cacheKey });

      t.mock.method(Product, "findById", () => ({
        lean: () => {
          throw mongooseError;
        },
      }));

      await assert.rejects(async () => await repo.getById({ productId })),
        (error: Error) => {
          assert.ok(error instanceof DatabaseError);
          assert.strictEqual(error.message, mongooseError.message);
          assert.strictEqual(error.statusCode, 500);
          return true;
        };
    });

    test("Should throw generic 'DatabaseError' when 'db.findById' throws unknown error", async (t) => {
      const unknownError = new Error("Something unexpected happened");

      mockCacheMiss({ instance: mockCache, cacheKey });

      t.mock.method(Product, "findById", () => ({
        lean: () => {
          throw unknownError;
        },
      }));

      await assert.rejects(
        async () => await repo.getById({ productId }),
        DatabaseError,
      );
    });
  });

  describe("getTopRated", () => {
    const mockProducts = generateMockSelectProducts({ count: 3 });
    const cacheId = "top-rated";
    const cacheKey = generateCacheKey({ cacheId });

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

      const products = await repo.getTopRated({});

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

      await repo.getTopRated({});

      assert.strictEqual(mockCache.generateKey.mock.callCount(), 1);
      assert.deepStrictEqual(mockCache.generateKey.mock.calls[0].arguments[0], {
        id: cacheId,
      });

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

      const products = await repo.getTopRated({});

      assert.ok(products);
      assert.deepStrictEqual(products, mockProducts);

      assert.strictEqual(mockCache.generateKey.mock.callCount(), 1);
      assert.deepStrictEqual(mockCache.generateKey.mock.calls[0].arguments[0], {
        id: "top-rated",
      });

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

      const products = await repo.getTopRated({});

      assert.ok(products);
      assert.strictEqual(products.length, 0);
    });

    test("Should throw 'DatabaseError' when 'db.find' throws Mongoose error", async (t) => {
      const mongooseError = new mongoose.Error.ValidationError();
      mongooseError.message = "Validation failed";

      mockCacheMiss({ instance: mockCache, cacheKey });

      t.mock.method(Product, "find", () => {
        throw mongooseError;
      });

      await assert.rejects(
        async () => await repo.getTopRated({}),
        (error: Error) => {
          assert.ok(error instanceof DatabaseError);
          assert.strictEqual(error.message, mongooseError.message);
          assert.strictEqual(error.statusCode, 500);
          return true;
        },
      );
    });

    test("Should throw generic 'DatabaseError' when 'db.find' throws unknown error", async (t) => {
      const unknownError = new Error("Something unexpected happened");

      mockCacheMiss({ instance: mockCache, cacheKey });

      t.mock.method(Product, "find", () => {
        throw unknownError;
      });

      await assert.rejects(
        async () => await repo.getTopRated({}),
        DatabaseError,
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

    const cacheId = productId.toString();
    const cacheKey = generateCacheKey({ cacheId });

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

      assert.strictEqual(mockCache.generateKey.mock.callCount(), 1);
      assert.deepStrictEqual(mockCache.generateKey.mock.calls[0].arguments[0], {
        id: cacheId,
      });

      assert.strictEqual(mockCache.delete.mock.callCount(), 1);
      assert.deepStrictEqual(mockCache.delete.mock.calls[0].arguments[0], {
        keys: cacheKey,
      });

      assert.strictEqual(mockCache.stats.mock.callCount(), 1);
      assert.strictEqual(mockCache.stats.mock.calls[0].arguments.length, 0);
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

    test("Should throw 'DatabaseError' when 'db.findByIdAndUpdate' throws Mongoose error", async (t) => {
      const mongooseError = new mongoose.Error.ValidationError();
      mongooseError.message = "Validation failed";

      t.mock.method(Product, "findByIdAndUpdate", () => ({
        lean: () => {
          throw mongooseError;
        },
      }));

      await assert.rejects(
        async () => await repo.update({ productId, data: updateData }),
        (error: Error) => {
          assert.ok(error instanceof DatabaseError);
          assert.strictEqual(error.message, mongooseError.message);
          assert.strictEqual(error.statusCode, 500);
          return true;
        },
      );
    });

    test("Should throw generic 'DatabaseError' when 'db.findByIdAndUpdate' throws unknown error", async (t) => {
      const unknownError = new Error("Something unexpected happened");
      t.mock.method(Product, "findByIdAndUpdate", () => ({
        lean: () => {
          throw unknownError;
        },
      }));

      await assert.rejects(
        async () => await repo.update({ productId, data: updateData }),
        DatabaseError,
      );
    });
  });

  describe("Delete Product", () => {
    const mockProduct = generateMockSelectProduct();
    const productId = mockProduct._id;

    const cacheId = productId.toString();
    const cacheKey = generateCacheKey({ cacheId });

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

      assert.strictEqual(mockCache.generateKey.mock.callCount(), 1);
      assert.deepStrictEqual(mockCache.generateKey.mock.calls[0].arguments[0], {
        id: productId.toString(),
      });

      assert.strictEqual(mockCache.delete.mock.callCount(), 1);
      assert.deepStrictEqual(mockCache.delete.mock.calls[0].arguments[0], {
        keys: cacheKey,
      });

      assert.strictEqual(mockCache.stats.mock.callCount(), 1);
      assert.strictEqual(mockCache.stats.mock.calls[0].arguments.length, 0);
    });

    test("Should return 'null' when 'db.findByIdAndDelete' returns 'null'", async (t) => {
      t.mock.method(Product, "findByIdAndDelete", () => ({
        lean: async () => null,
      }));

      const deletedProduct = await repo.delete({ productId });

      assert.strictEqual(deletedProduct, null);
    });

    test("Should throw 'DatabaseError' when 'db.findByIdAndDelete' throws Mongoose error", async (t) => {
      const mongooseError = new mongoose.Error.ValidationError();
      mongooseError.message = "Validation failed";

      t.mock.method(Product, "findByIdAndDelete", () => {
        throw mongooseError;
      });

      await assert.rejects(
        async () => await repo.delete({ productId }),
        (error: Error) => {
          assert.ok(error instanceof DatabaseError);
          assert.strictEqual(error.message, mongooseError.message);
          assert.strictEqual(error.statusCode, 500);
          return true;
        },
      );
    });

    test("Should throw generic 'DatabaseError' when 'db.findByIdAndDelete' throws unknown error", async (t) => {
      const unknownError = new Error("Something unexpected happened");

      t.mock.method(Product, "findByIdAndDelete", () => {
        throw unknownError;
      });

      await assert.rejects(
        async () => await repo.delete({ productId }),
        DatabaseError,
      );
    });
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

    test("Should throw 'DatabaseError' when 'db.countDocuments' throws Mongoose error", async (t) => {
      const mongooseError = new mongoose.Error("Count failed");

      t.mock.method(Product, "countDocuments", () => {
        throw mongooseError;
      });

      await assert.rejects(
        async () => await repo.count({}),
        (error: Error) => {
          assert.ok(error instanceof DatabaseError);
          assert.strictEqual(error.message, mongooseError.message);
          assert.strictEqual(error.statusCode, 500);
          return true;
        },
      );
    });

    test("Should throw generic 'DatabaseError' when 'db.countDocuments' throws unknown error", async (t) => {
      const unknownError = new Error("Something unexpected happened");

      t.mock.method(Product, "countDocuments", () => {
        throw unknownError;
      });

      await assert.rejects(async () => await repo.count({}), DatabaseError);
    });
  });
});
