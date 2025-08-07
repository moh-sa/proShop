import NodeCache from "node-cache";
import assert from "node:assert";
import test, { beforeEach, describe, suite } from "node:test";
import { DEFAULT_CACHE_CONFIG, MAX_CACHE_SIZE } from "../../config";
import {
  CacheCapacityError,
  CacheOperationError,
  CacheValidationError,
} from "../../errors";
import { CacheManager } from "../../managers";
import { cacheItemSchema } from "../../schemas";
import { CacheConfig, Namespace } from "../../types";
import { mockNodeCache } from "../mocks";

suite("Cache Manager 〖 Unit Tests 〗", () => {
  const namespace: Namespace = "product";
  const mockCache = mockNodeCache();
  let cacheManager: CacheManager;

  beforeEach(() => {
    cacheManager = new CacheManager(namespace);
    cacheManager["_cache"] = mockCache as unknown as NodeCache;
    mockCache.reset();
  });

  describe("Constructor", () => {
    test("Should create a new CacheManager instance with default config", () => {
      const cacheManager = new CacheManager(namespace);

      assert.ok(cacheManager);
      assert.ok(cacheManager instanceof CacheManager);
      assert.strictEqual(cacheManager["_namespace"], namespace);
      assert.strictEqual(
        cacheManager["_cache"].options.stdTTL,
        DEFAULT_CACHE_CONFIG.stdTTL,
      );
    });

    test("Should create a new CacheManager instance with custom config", () => {
      const cacheConfig: Partial<CacheConfig> = { stdTTL: 1000 };
      const cacheManager = new CacheManager(namespace, cacheConfig);

      assert.ok(cacheManager);
      assert.ok(cacheManager instanceof CacheManager);
      assert.strictEqual(cacheManager["_namespace"], namespace);
      assert.strictEqual(
        cacheManager["_cache"].options.stdTTL,
        cacheConfig.stdTTL,
      );
    });
  });

  describe("Set", () => {
    test("Should return 'success' and 'data' when '_cache.set' returns 'true'", (t) => {
      // Arrange
      const key = "test-key";
      const value = "test-data";

      cacheManager["_validateMemoryCapacity"] = t.mock.fn(() => {});
      cacheManager["_validateSchema"] = t.mock.fn(() => ({ key, val: value }));
      mockCache.set.mock.mockImplementationOnce(() => true);

      // Act
      const result = cacheManager.set({ key, value });

      // Assert
      assert.ok(result.success);
      assert.ok(result.data);
    });

    test("Should return 'success', 'key', and 'error' when '_cache.set' returns 'false'", (t) => {
      // Arrange
      const key = "test-key";
      const value = "test-data";

      cacheManager["_validateMemoryCapacity"] = t.mock.fn(() => {});
      cacheManager["_validateSchema"] = t.mock.fn(() => ({ key, val: value }));
      mockCache.set.mock.mockImplementationOnce(() => false);

      // Act
      const result = cacheManager.set({ key, value });

      // Assert
      assert.ok(!result.success);
      assert.ok(result.key);
      assert.ok(result.error);
    });

    test("Should return the correct 'data' when '_cache.set' returns 'true'", (t) => {
      // Arrange
      const key = "test-key";
      const value = "test-data";

      cacheManager["_validateMemoryCapacity"] = t.mock.fn(() => {});
      cacheManager["_validateSchema"] = t.mock.fn(() => ({ key, val: value }));
      mockCache.set.mock.mockImplementationOnce(() => true);

      // Act
      const result = cacheManager.set({ key, value });

      // Assert
      assert.ok(result.success);
      assert.strictEqual(result.data, `${namespace}:${key}`);
    });

    test("Should return the correct 'key' when '_cache.set' returns 'false'", (t) => {
      // Arrange
      const key = "test-key";
      const value = "test-data";

      cacheManager["_validateMemoryCapacity"] = t.mock.fn(() => {});
      cacheManager["_validateSchema"] = t.mock.fn(() => ({ key, val: value }));
      mockCache.set.mock.mockImplementationOnce(() => false);

      // Act
      const result = cacheManager.set({ key, value });

      // Assert
      assert.ok(!result.success);
      assert.strictEqual(result.key, `${namespace}:${key}`);
    });

    test("Should return 'error' instance of 'CacheOperationError' when '_cache.set' returns 'false'", (t) => {
      // Arrange
      const key = "test-key";
      const value = "test-data";

      cacheManager["_validateMemoryCapacity"] = t.mock.fn(() => {});
      cacheManager["_validateSchema"] = t.mock.fn(() => ({ key, val: value }));
      mockCache.set.mock.mockImplementationOnce(() => false);

      // Act
      const result = cacheManager.set({ key, value });

      // Assert
      assert.ok(!result.success);
      assert.ok(result.error instanceof CacheOperationError);
    });

    test("Should return 'error' instance of 'CacheOperationError' when '_cache.set' throws", (t) => {
      // Arrange
      const key = "test-key";
      const value = "test-data";

      cacheManager["_validateMemoryCapacity"] = t.mock.fn(() => {});
      cacheManager["_validateSchema"] = t.mock.fn(() => ({ key, val: value }));
      mockCache.set.mock.mockImplementationOnce(() => {
        throw new Error();
      });

      // Act
      const result = cacheManager.set({ key, value });

      // Assert
      assert.ok(!result.success);
      assert.ok(result.error instanceof CacheOperationError);
    });
  });

  describe("setMany", () => {
    test("Should return 'array' of 'success' and 'data' when '_cache.setMany' returns 'true''", (t) => {
      // Arrange
      const key = "test-key";
      const val = "test-value";

      cacheManager["_validateMemoryCapacity"] = t.mock.fn(() => {});
      cacheManager["_validateSchema"] = t.mock.fn(() => [{ key, val }]);
      cacheManager["_generateCacheKey"] = t.mock.fn(() => key);
      mockCache.set.mock.mockImplementation(() => true);

      // Act
      const result = cacheManager.setMany([{ key, value: val }]);

      // Arrest
      assert.ok(Array.isArray(result));
      assert.ok(result.length === 1);
      assert.ok(result[0].success);
      assert.ok(result[0].data);
    });

    test("Should return 'array' of 'success', 'key', and 'error' when '_cache.setMany' returns 'false'", (t) => {
      // Arrange
      const key = "test-key";
      const val = "test-value";

      cacheManager["_validateMemoryCapacity"] = t.mock.fn(() => {});
      cacheManager["_validateSchema"] = t.mock.fn(() => [{ key, val }]);
      cacheManager["_generateCacheKey"] = t.mock.fn(() => key);
      mockCache.set.mock.mockImplementation(() => false);

      // Act
      const result = cacheManager.setMany([{ key, value: val }]);

      // Arrest
      assert.ok(Array.isArray(result));
      assert.ok(result.length === 1);
      assert.ok(!result[0].success);
      assert.ok(result[0].key);
      assert.ok(result[0].error);
    });

    test("Should return the correct 'data' when '_cache.setMany' returns 'true'", (t) => {
      // Arrange
      const key = "test-key";
      const val = "test-value";

      cacheManager["_validateMemoryCapacity"] = t.mock.fn(() => {});
      cacheManager["_validateSchema"] = t.mock.fn(() => [{ key, val }]);
      cacheManager["_generateCacheKey"] = t.mock.fn(() => key);
      mockCache.set.mock.mockImplementation(() => true);

      // Act
      const result = cacheManager.setMany([{ key, value: val }]);

      // Arrest
      assert.ok(Array.isArray(result));
      assert.ok(result.length === 1);
      assert.ok(result[0].success);
      assert.strictEqual(result[0].data, key);
    });

    test("Should return the correct 'key' when '_cache.setMany' returns 'false'", (t) => {
      // Arrange
      const key = "test-key";
      const val = "test-value";

      cacheManager["_validateMemoryCapacity"] = t.mock.fn(() => {});
      cacheManager["_validateSchema"] = t.mock.fn(() => [{ key, val }]);
      cacheManager["_generateCacheKey"] = t.mock.fn(() => key);
      mockCache.set.mock.mockImplementation(() => false);

      // Act
      const result = cacheManager.setMany([{ key, value: val }]);

      // Arrest
      assert.ok(Array.isArray(result));
      assert.ok(result.length === 1);
      assert.ok(!result[0].success);
      assert.strictEqual(result[0].key, key);
    });

    test("Should return 'error' instance of 'CacheOperationError' when '_cache.setMany' returns 'false'", (t) => {
      // Arrange
      const key = "test-key";
      const val = "test-value";

      cacheManager["_validateMemoryCapacity"] = t.mock.fn(() => {});
      cacheManager["_validateSchema"] = t.mock.fn(() => [{ key, val }]);
      cacheManager["_generateCacheKey"] = t.mock.fn(() => key);
      mockCache.set.mock.mockImplementationOnce(() => false);

      // Act
      const result = cacheManager.setMany([{ key, value: val }]);

      // Arrest
      assert.ok(Array.isArray(result));
      assert.ok(result.length === 1);
      assert.ok(!result[0].success);
      assert.ok(result[0].error instanceof CacheOperationError);
    });

    test("Should return 'error' instance of 'CacheOperationError' when '_cache.setMany' throws", (t) => {
      // Arrange
      const key = "test-key";
      const val = "test-value";

      cacheManager["_validateMemoryCapacity"] = t.mock.fn(() => {});
      cacheManager["_validateSchema"] = t.mock.fn(() => [{ key, val }]);
      cacheManager["_generateCacheKey"] = t.mock.fn(() => key);
      mockCache.set.mock.mockImplementationOnce(() => {
        throw new Error();
      });

      // Act
      const result = cacheManager.setMany([{ key, value: val }]);

      // Arrest
      assert.ok(Array.isArray(result));
      assert.ok(result.length === 1);
      assert.ok(!result[0].success);
      assert.ok(result[0].error instanceof CacheOperationError);
    });
  });

  describe("Get", () => {
    test("Should return 'success' and 'data' when '_cache.get' returns data", (t) => {
      // Arrange
      const key = "test-key";
      const value = "test-data";

      cacheManager["_validateSchema"] = t.mock.fn(() => key);
      cacheManager["_generateCacheKey"] = t.mock.fn(() => key);
      mockCache.get.mock.mockImplementationOnce(() => value);

      // Act
      const result = cacheManager.get({ key });

      // Assert
      assert.ok(result.success);
      assert.ok(result.data);
    });

    test("Should return 'success', 'key', and 'error' when '_cache.get' returns 'undefined'", (t) => {
      // Arrange
      const key = "test-key";

      cacheManager["_validateSchema"] = t.mock.fn(() => key);
      cacheManager["_generateCacheKey"] = t.mock.fn(() => key);
      mockCache.get.mock.mockImplementationOnce(() => undefined);

      // Act
      const result = cacheManager.get({ key });

      // Assert
      assert.ok(!result.success);
      assert.ok(result.key);
      assert.ok(result.error);
    });

    test("Should return the correct 'data' when '_cache.get' returns data", (t) => {
      // Arrange
      const key = "test-key";
      const value = "test-data";

      cacheManager["_validateSchema"] = t.mock.fn(() => key);
      cacheManager["_generateCacheKey"] = t.mock.fn(() => key);
      mockCache.get.mock.mockImplementationOnce(() => value);

      // Act
      const result = cacheManager.get({ key });

      // Assert
      assert.ok(result.success);
      assert.strictEqual(result.data, value);
    });

    test("Should return the correct 'key' when '_cache.get' returns 'undefined'", (t) => {
      // Arrange
      const key = "test-key";

      cacheManager["_validateSchema"] = t.mock.fn(() => key);
      cacheManager["_generateCacheKey"] = t.mock.fn(() => key);
      mockCache.get.mock.mockImplementationOnce(() => undefined);

      // Act
      const result = cacheManager.get({ key });

      // Assert
      assert.ok(!result.success);
      assert.strictEqual(result.key, key);
    });

    test("Should return 'error' instance of 'CacheOperationError' when '_cache.get' returns 'undefined'", (t) => {
      // Arrange
      const key = "test-key";
      const value = "test-data";

      cacheManager["_validateSchema"] = t.mock.fn(() => key);
      cacheManager["_generateCacheKey"] = t.mock.fn(() => key);
      mockCache.get.mock.mockImplementationOnce(() => undefined);

      // Act
      const result = cacheManager.get({ key });

      // Assert
      assert.ok(!result.success);
      assert.ok(result.error instanceof CacheOperationError);
    });

    test("Should return 'error' instance of 'CacheOperationError' when '_cache.get' throws", (t) => {
      // Arrange
      const key = "test-key";

      cacheManager["_validateSchema"] = t.mock.fn(() => key);
      cacheManager["_generateCacheKey"] = t.mock.fn(() => key);
      mockCache.get.mock.mockImplementationOnce(() => {
        throw new Error();
      });

      // Act
      const result = cacheManager.get({ key });

      // Assert
      assert.ok(!result.success);
      assert.ok(result.error instanceof CacheOperationError);
    });
  });

  describe("getMany", () => {
    test("Should return 'array' of 'success' and 'data' when '_cache.getMany' returns data", (t) => {
      // Arrange
      const key = "test-key";
      const value = "test-value";

      cacheManager["_validateSchema"] = t.mock.fn(() => [key]);
      cacheManager["_generateCacheKey"] = t.mock.fn(() => key);
      mockCache.get.mock.mockImplementation(() => value);

      // Act
      const result = cacheManager.getMany({ keys: [key] });

      // Arrest
      assert.ok(Array.isArray(result));
      assert.ok(result.length === 1);
      assert.ok(result[0].success);
      assert.ok(result[0].data);
    });

    test("Should return 'array' of 'success', 'key', and 'error' when '_cache.getMany' returns 'undefined'", (t) => {
      // Arrange
      const key = "test-key";

      cacheManager["_validateSchema"] = t.mock.fn(() => [key]);
      cacheManager["_generateCacheKey"] = t.mock.fn(() => key);
      mockCache.get.mock.mockImplementation(() => undefined);

      // Act
      const result = cacheManager.getMany({ keys: [key] });

      // Arrest
      assert.ok(Array.isArray(result));
      assert.ok(result.length === 1);
      assert.ok(!result[0].success);
      assert.ok(result[0].key);
      assert.ok(result[0].error);
    });

    test("Should return the correct 'data' when '_cache.getMany' returns data", (t) => {
      // Arrange
      const key = "test-key";
      const value = "test-value";

      cacheManager["_validateSchema"] = t.mock.fn(() => [key]);
      cacheManager["_generateCacheKey"] = t.mock.fn(() => key);
      mockCache.get.mock.mockImplementation(() => value);

      // Act
      const result = cacheManager.getMany({ keys: [key] });

      // Arrest
      assert.ok(Array.isArray(result));
      assert.ok(result.length === 1);
      assert.ok(result[0].success);
      assert.strictEqual(result[0].data, value);
    });

    test("Should return the correct 'key' when '_cache.getMany' returns 'undefined'", (t) => {
      // Arrange
      const key = "test-key";

      cacheManager["_validateSchema"] = t.mock.fn(() => [key]);
      cacheManager["_generateCacheKey"] = t.mock.fn(() => key);
      mockCache.get.mock.mockImplementation(() => undefined);

      // Act
      const result = cacheManager.getMany({ keys: [key] });

      // Arrest
      assert.ok(Array.isArray(result));
      assert.ok(result.length === 1);
      assert.ok(!result[0].success);
      assert.strictEqual(result[0].key, key);
    });

    test("Should return 'error' instance of 'CacheOperationError' when '_cache.getMany' returns 'undefined'", (t) => {
      // Arrange
      const key = "test-key";

      cacheManager["_validateSchema"] = t.mock.fn(() => [key]);
      cacheManager["_generateCacheKey"] = t.mock.fn(() => key);
      mockCache.get.mock.mockImplementationOnce(() => undefined);

      // Act
      const result = cacheManager.getMany({ keys: [key] });

      // Arrest
      assert.ok(Array.isArray(result));
      assert.ok(result.length === 1);
      assert.ok(!result[0].success);
      assert.ok(result[0].error instanceof CacheOperationError);
    });

    test("Should return 'error' instance of 'CacheOperationError' when '_cache.getMany' throws", (t) => {
      // Arrange
      const key = "test-key";

      cacheManager["_validateSchema"] = t.mock.fn(() => [key]);
      cacheManager["_generateCacheKey"] = t.mock.fn(() => key);
      mockCache.get.mock.mockImplementationOnce(() => {
        throw new Error();
      });

      // Act
      const result = cacheManager.getMany({ keys: [key] });

      // Arrest
      assert.ok(Array.isArray(result));
      assert.ok(result.length === 1);
      assert.ok(!result[0].success);
      assert.ok(result[0].error instanceof CacheOperationError);
    });
  });

  describe("Delete", () => {
    test("Should return 'success' and 'data' when '_cache.delete' returns '1'", (t) => {
      // Arrange
      const key = "test-key";

      cacheManager["_validateSchema"] = t.mock.fn(() => key);
      cacheManager["_generateCacheKey"] = t.mock.fn(() => key);
      mockCache.del.mock.mockImplementationOnce(() => 1);

      // Act
      const result = cacheManager.delete({ key });

      // Assert
      assert.ok(result.success);
      assert.ok(result.data);
    });

    test("Should return 'success', 'key', and 'error' when '_cache.delete' returns '0'", (t) => {
      // Arrange
      const key = "test-key";

      cacheManager["_validateSchema"] = t.mock.fn(() => key);
      cacheManager["_generateCacheKey"] = t.mock.fn(() => key);
      mockCache.del.mock.mockImplementationOnce(() => 0);

      // Act
      const result = cacheManager.delete({ key });

      // Assert
      assert.ok(!result.success);
      assert.ok(result.key);
      assert.ok(result.error);
    });

    test("Should return the correct 'data' when '_cache.delete' returns '1'", (t) => {
      // Arrange
      const key = "test-key";

      cacheManager["_validateSchema"] = t.mock.fn(() => key);
      cacheManager["_generateCacheKey"] = t.mock.fn(() => key);
      mockCache.del.mock.mockImplementationOnce(() => 1);

      // Act
      const result = cacheManager.delete({ key });

      // Assert
      assert.ok(result.success);
      assert.strictEqual(result.data, key);
    });

    test("Should return the correct 'key' when '_cache.delete' returns '0'", (t) => {
      // Arrange
      const key = "test-key";

      cacheManager["_validateSchema"] = t.mock.fn(() => key);
      cacheManager["_generateCacheKey"] = t.mock.fn(() => key);
      mockCache.del.mock.mockImplementationOnce(() => 0);

      // Act
      const result = cacheManager.delete({ key });

      // Assert
      assert.ok(!result.success);
      assert.strictEqual(result.key, key);
    });

    test("Should return 'error' instance of 'CacheOperationError' when '_cache.delete' returns '0'", (t) => {
      // Arrange
      const key = "test-key";

      cacheManager["_validateSchema"] = t.mock.fn(() => key);
      cacheManager["_generateCacheKey"] = t.mock.fn(() => key);
      mockCache.del.mock.mockImplementationOnce(() => 0);

      // Act
      const result = cacheManager.delete({ key });

      // Assert
      assert.ok(!result.success);
      assert.ok(result.error instanceof CacheOperationError);
    });

    test("Should return 'error' instance of 'CacheOperationError' when '_cache.delete' throws", (t) => {
      // Arrange
      const key = "test-key";

      cacheManager["_validateSchema"] = t.mock.fn(() => key);
      cacheManager["_generateCacheKey"] = t.mock.fn(() => key);
      mockCache.del.mock.mockImplementationOnce(() => {
        throw new Error();
      });

      // Act
      const result = cacheManager.delete({ key });

      // Assert
      assert.ok(!result.success);
      assert.ok(result.error instanceof CacheOperationError);
    });
  });

  describe("deleteMany", () => {
    test("Should return 'array' of 'success' and 'data' when '_cache.deleteMany' returns '1'", (t) => {
      // Arrange
      const key = "test-key";

      cacheManager["_validateSchema"] = t.mock.fn(() => [key]);
      cacheManager["_generateCacheKey"] = t.mock.fn(() => key);
      mockCache.del.mock.mockImplementation(() => 1);

      // Act
      const result = cacheManager.deleteMany({ keys: [key] });

      // Assert
      assert.ok(Array.isArray(result));
      assert.ok(result.length === 1);
      assert.ok(result[0].success);
      assert.ok(result[0].data);
    });

    test("Should return 'array' of 'success', 'key', and 'error' when '_cache.deleteMany' returns '0'", (t) => {
      // Arrange
      const key = "test-key";

      cacheManager["_validateSchema"] = t.mock.fn(() => [key]);
      cacheManager["_generateCacheKey"] = t.mock.fn(() => key);
      mockCache.del.mock.mockImplementation(() => 0);

      // Act
      const result = cacheManager.deleteMany({ keys: [key] });

      // Assert
      assert.ok(Array.isArray(result));
      assert.ok(result.length === 1);
      assert.ok(!result[0].success);
      assert.ok(result[0].key);
      assert.ok(result[0].error);
    });

    test("Should return the correct 'data' when '_cache.deleteMany' returns '1'", (t) => {
      // Arrange
      const key = "test-key";

      cacheManager["_validateSchema"] = t.mock.fn(() => [key]);
      cacheManager["_generateCacheKey"] = t.mock.fn(() => key);
      mockCache.del.mock.mockImplementation(() => 1);

      // Act
      const result = cacheManager.deleteMany({ keys: [key] });

      // Assert
      assert.ok(result[0].success);
      assert.strictEqual(result[0].data, key);
    });

    test("Should return the correct 'key' when '_cache.deleteMany' returns '0'", (t) => {
      // Arrange
      const key = "test-key";

      cacheManager["_validateSchema"] = t.mock.fn(() => [key]);
      cacheManager["_generateCacheKey"] = t.mock.fn(() => key);
      mockCache.del.mock.mockImplementation(() => 0);

      // Act
      const result = cacheManager.deleteMany({ keys: [key] });

      // Assert
      assert.ok(!result[0].success);
      assert.strictEqual(result[0].key, key);
    });

    test("Should return 'error' instance of 'CacheOperationError' when '_cache.deleteMany' returns '0'", (t) => {
      // Arrange
      const key = "test-key";

      cacheManager["_validateSchema"] = t.mock.fn(() => [key]);
      cacheManager["_generateCacheKey"] = t.mock.fn(() => key);
      mockCache.del.mock.mockImplementationOnce(() => 0);

      // Act
      const result = cacheManager.deleteMany({ keys: [key] });

      // Assert
      assert.ok(!result[0].success);
      assert.ok(result[0].error instanceof CacheOperationError);
    });

    test("Should return 'error' instance of 'CacheOperationError' when '_cache.deleteMany' throws", (t) => {
      // Arrange
      const key = "test-key";

      cacheManager["_validateSchema"] = t.mock.fn(() => [key]);
      cacheManager["_generateCacheKey"] = t.mock.fn(() => key);
      mockCache.del.mock.mockImplementationOnce(() => {
        throw new Error();
      });

      // Act
      const result = cacheManager.deleteMany({ keys: [key] });

      // Assert
      assert.ok(!result[0].success);
      assert.ok(result[0].error instanceof CacheOperationError);
    });
  });

  describe("take", () => {
    test("Should return 'success' and 'data' when '_cache.take' returns data", (t) => {
      // Arrange
      const key = "test-key";
      const value = "test-value";

      cacheManager["_validateSchema"] = t.mock.fn(() => key);
      cacheManager["_generateCacheKey"] = t.mock.fn(() => key);
      mockCache.take.mock.mockImplementationOnce(() => value);

      // Act
      const result = cacheManager.take({ key });

      // Assert
      assert.ok(result.success);
      assert.ok(result.data);
    });

    test("Should return 'success', 'key', and 'error' when '_cache.take' returns 'undefined'", (t) => {
      // Arrange
      const key = "test-key";

      cacheManager["_validateSchema"] = t.mock.fn(() => key);
      cacheManager["_generateCacheKey"] = t.mock.fn(() => key);
      mockCache.take.mock.mockImplementationOnce(() => undefined);

      // Act
      const result = cacheManager.take({ key });

      // Assert
      assert.ok(!result.success);
      assert.ok(result.key);
      assert.ok(result.error);
    });

    test("Should return the correct 'data' when '_cache.take' returns data", (t) => {
      // Arrange
      const key = "test-key";
      const value = "test-value";

      cacheManager["_validateSchema"] = t.mock.fn(() => key);
      cacheManager["_generateCacheKey"] = t.mock.fn(() => key);
      mockCache.take.mock.mockImplementationOnce(() => value);

      // Act
      const result = cacheManager.take({ key });

      // Assert
      assert.ok(result.success);
      assert.strictEqual(result.data, value);
    });

    test("Should return the correct 'key' when '_cache.take' returns 'undefined'", (t) => {
      // Arrange
      const key = "test-key";

      cacheManager["_validateSchema"] = t.mock.fn(() => key);
      cacheManager["_generateCacheKey"] = t.mock.fn(() => key);
      mockCache.take.mock.mockImplementationOnce(() => undefined);

      // Act
      const result = cacheManager.take({ key });

      // Assert
      assert.ok(!result.success);
      assert.strictEqual(result.key, key);
    });

    test("Should return 'error' instance of 'CacheOperationError' when '_cache.take' returns 'undefined'", (t) => {
      // Arrange
      const key = "test-key";

      cacheManager["_validateSchema"] = t.mock.fn(() => key);
      cacheManager["_generateCacheKey"] = t.mock.fn(() => key);
      mockCache.take.mock.mockImplementationOnce(() => undefined);

      // Act
      const result = cacheManager.take({ key });

      // Assert
      assert.ok(!result.success);
      assert.ok(result.error instanceof CacheOperationError);
    });

    test("Should return 'error' instance of 'CacheOperationError' when '_cache.take' throws", (t) => {
      // Arrange
      const key = "test-key";

      cacheManager["_validateSchema"] = t.mock.fn(() => key);
      cacheManager["_generateCacheKey"] = t.mock.fn(() => key);
      mockCache.take.mock.mockImplementationOnce(() => {
        throw new Error();
      });

      // Act
      const result = cacheManager.take({ key });

      // Assert
      assert.ok(!result.success);
      assert.ok(result.error instanceof CacheOperationError);
    });
  });

  describe("Flush", () => {
    test("Should throw 'CacheOperationError' when '_cache.flushAll' throws", () => {
      mockCache.flushAll.mock.mockImplementationOnce(() => {
        throw new Error();
      });

      assert.throws(() => {
        cacheManager.flush();
      }, CacheOperationError);
    });
  });

  describe("getStats", () => {
    test("Should return 'hits', 'misses', 'numberOfKeys', 'keysSize', and 'valuesSize' when '_cache.getStats' is called", (t) => {
      // Arrange
      const stats = {
        hits: 1,
        misses: 1,
        keys: 1,
        ksize: 1,
        vsize: 1,
      };

      mockCache.getStats.mock.mockImplementationOnce(() => stats);

      // Act
      const result = cacheManager.getStats();

      // Assert
      assert.ok(result.hits);
      assert.ok(result.misses);
      assert.ok(result.numberOfKeys);
      assert.ok(result.keysSize);
      assert.ok(result.valuesSize);
    });

    test("Should return 'totalSize' which is the sum of 'keysSize' and 'valuesSize' when '_cache.getStats' is called", (t) => {
      // Arrange
      const stats = {
        hits: 1,
        misses: 1,
        keys: 1,
        ksize: 1,
        vsize: 1,
      };

      mockCache.getStats.mock.mockImplementationOnce(() => stats);

      // Act
      const result = cacheManager.getStats();

      // Assert
      assert.strictEqual(result.totalSize, stats.ksize + stats.vsize);
    });
  });

  describe("isKeyCached", () => {
    test("Should return 'success' and 'data' when '_cache.has' returns 'true'", (t) => {
      // Arrange
      const key = "test-key";

      cacheManager["_validateSchema"] = t.mock.fn(() => key);
      cacheManager["_generateCacheKey"] = t.mock.fn(() => key);
      mockCache.has.mock.mockImplementationOnce(() => true);

      // Act
      const result = cacheManager.isKeyCached({ key });

      // Assert
      assert.ok(result.success);
      assert.ok(result.data);
    });

    test("Should return 'success', 'key', and 'error' when '_cache.has' returns 'false'", (t) => {
      // Arrange
      const key = "test-key";

      cacheManager["_validateSchema"] = t.mock.fn(() => key);
      cacheManager["_generateCacheKey"] = t.mock.fn(() => key);
      mockCache.has.mock.mockImplementationOnce(() => false);

      // Act
      const result = cacheManager.isKeyCached({ key });

      // Assert
      assert.ok(!result.success);
      assert.ok(result.key);
      assert.ok(result.error);
    });

    test("Should return the correct 'data' when '_cache.has' returns 'true'", (t) => {
      // Arrange
      const key = "test-key";

      cacheManager["_validateSchema"] = t.mock.fn(() => key);
      cacheManager["_generateCacheKey"] = t.mock.fn(() => key);
      mockCache.has.mock.mockImplementationOnce(() => true);

      // Act
      const result = cacheManager.isKeyCached({ key });

      // Assert
      assert.ok(result.success);
      assert.strictEqual(result.data, key);
    });

    test("Should return the correct 'key' when '_cache.has' returns 'false'", (t) => {
      // Arrange
      const key = "test-key";

      cacheManager["_validateSchema"] = t.mock.fn(() => key);
      cacheManager["_generateCacheKey"] = t.mock.fn(() => key);
      mockCache.has.mock.mockImplementationOnce(() => false);

      // Act
      const result = cacheManager.isKeyCached({ key });

      // Assert
      assert.ok(!result.success);
      assert.strictEqual(result.key, key);
    });

    test("Should return 'error' instance of 'CacheOperationError' when '_cache.has' returns 'false'", (t) => {
      // Arrange
      const key = "test-key";

      cacheManager["_validateSchema"] = t.mock.fn(() => key);
      cacheManager["_generateCacheKey"] = t.mock.fn(() => key);
      mockCache.has.mock.mockImplementationOnce(() => false);

      // Act
      const result = cacheManager.isKeyCached({ key });

      // Assert
      assert.ok(!result.success);
      assert.ok(result.error instanceof CacheOperationError);
    });

    test("Should return 'error' instance of 'CacheOperationError' when '_cache.has' throws", (t) => {
      // Arrange
      const key = "test-key";

      cacheManager["_validateSchema"] = t.mock.fn(() => key);
      cacheManager["_generateCacheKey"] = t.mock.fn(() => key);
      mockCache.has.mock.mockImplementationOnce(() => {
        throw new Error();
      });

      // Act
      const result = cacheManager.isKeyCached({ key });

      // Assert
      assert.ok(!result.success);
      assert.ok(result.error instanceof CacheOperationError);
    });
  });

  describe("generateCacheKey", () => {
    test("Should add 'namespace' as a prefix to the key", () => {
      // Arrange
      const key = "test-key";

      // Act
      const result = cacheManager["_generateCacheKey"]({ id: key });

      // Assert
      const expectedKey = `${namespace}:${key}`;
      assert.strictEqual(result, expectedKey);
    });
  });

  describe("validateSchema", () => {
    test("Should take 'schema' and 'data' and return the correct data", () => {
      // Arrange
      const data = {
        key: "test-key",
        val: "test-value",
        ttl: 1000,
      };

      // Act
      const result = cacheManager["_validateSchema"]({
        schema: cacheItemSchema,
        data,
      });

      // Assert
      assert.ok(result);
      assert.ok(result.key);
      assert.strictEqual(result.key, data.key);
      assert.ok(result.val);
      assert.strictEqual(result.val, data.val);
      assert.ok(result.ttl);
      assert.strictEqual(result.ttl, data.ttl);
    });

    test("Should throw 'CacheValidationError' when 'data.key' is invalid", () => {
      // Arrange
      const data = {
        key: 1234,
        val: "test-value",
        ttl: "1000", // string instead of number
      };

      // Act & Assert
      assert.throws(() => {
        cacheManager["_validateSchema"]({
          schema: cacheItemSchema,
          // @ts-expect-error - test case
          data,
        });
      }, CacheValidationError);
    });

    test("Should throw 'CacheValidationError' when 'data.ttl' is invalid", () => {
      // Arrange
      const data = {
        key: "test-key",
        val: "test-value",
        ttl: "1000", // string instead of number
      };

      // Act & Assert
      assert.throws(() => {
        cacheManager["_validateSchema"]({
          schema: cacheItemSchema,
          // @ts-expect-error - test case
          data,
        });
      }, CacheValidationError);
    });

    test("Should throw 'CacheValidationError' when 'data.key' is invalid", () => {
      // Arrange
      const data = {
        key: 1234,
        val: "test-value",
        ttl: "1000",
      };

      // Act & Assert
      assert.throws(() => {
        cacheManager["_validateSchema"]({
          schema: cacheItemSchema,
          // @ts-expect-error - test case
          data,
        });
      }, CacheValidationError);
    });
  });

  describe("validateMemoryCapacity", () => {
    test("Should return early when batchSize is 0", () => {
      // Arrange
      const batchSize = 0;
      mockCache.keys.mock.mockImplementationOnce(() => []);

      // Act
      cacheManager["_validateMemoryCapacity"](batchSize);

      // Assert
      assert.strictEqual(mockCache.keys.mock.callCount(), 0);
    });

    test("Should throw 'CacheCapacityError' when batchSize exceeds 'MAX_CACHE_SIZE'", () => {
      // Arrange
      const batchSize = MAX_CACHE_SIZE + 1;

      // Act & Assert
      assert.throws(() => {
        cacheManager["_validateMemoryCapacity"](batchSize);
      }, CacheCapacityError);
    });

    test("Should return early when cache is empty", () => {
      // Arrange
      const batchSize = 5;
      mockCache.keys.mock.mockImplementationOnce(() => []);

      // Act
      cacheManager["_validateMemoryCapacity"](batchSize);

      // Assert
      assert.strictEqual(mockCache.keys.mock.callCount(), 1);
      assert.strictEqual(mockCache.getTtl.mock.callCount(), 0);
      assert.strictEqual(mockCache.del.mock.callCount(), 0);
    });

    test("Should return early when sufficient space is available", () => {
      // Arrange
      const batchSize = 5;
      const currentKeys = ["key1", "key2", "key3"]; // 3 used out of MAX_CACHE_SIZE (1000)

      mockCache.keys.mock.mockImplementationOnce(() => currentKeys);

      // Act
      cacheManager["_validateMemoryCapacity"](batchSize);

      // Assert
      assert.strictEqual(mockCache.keys.mock.callCount(), 1);
      assert.strictEqual(mockCache.getTtl.mock.callCount(), 0);
      assert.strictEqual(mockCache.del.mock.callCount(), 0);
    });

    test("Should delete correct number of keys when space is needed", () => {
      // Arrange
      const batchSize = 10;
      const currentKeys = Array.from({ length: 995 }, (_, i) => `key${i}`); // 995 used, 5 available
      const spaceNeeded = batchSize - (MAX_CACHE_SIZE - currentKeys.length); // 10 - 5 = 5
      const fallbackSpace = Math.ceil(currentKeys.length * 0.1); // 100
      const expectedKeysToDelete = Math.max(spaceNeeded, fallbackSpace); // 100

      mockCache.keys.mock.mockImplementationOnce(() => currentKeys);
      mockCache.getTtl.mock.mockImplementation(() => 1000);
      mockCache.del.mock.mockImplementationOnce(() => 1);

      // Act
      cacheManager["_validateMemoryCapacity"](batchSize);

      // Assert
      assert.strictEqual(mockCache.keys.mock.callCount(), 1);
      assert.strictEqual(mockCache.getTtl.mock.callCount(), currentKeys.length);
      assert.strictEqual(mockCache.del.mock.callCount(), 1);

      const deletedKeys = mockCache.del.mock.calls[0].arguments[0];
      assert.ok(Array.isArray(deletedKeys));
      assert.strictEqual(deletedKeys.length, expectedKeysToDelete);
    });

    test("Should use fallback space when it's larger than spaceNeeded", () => {
      // Arrange
      const batchSize = 20;
      const currentKeys = Array.from({ length: 990 }, (_, i) => `key${i}`); // 990 used, 10 available
      const spaceNeeded = batchSize - (MAX_CACHE_SIZE - currentKeys.length); // 20 - 10 = 10
      const fallbackSpace = Math.ceil(currentKeys.length * 0.1); // 99
      const expectedKeysToDelete = Math.max(spaceNeeded, fallbackSpace); // 99

      mockCache.keys.mock.mockImplementationOnce(() => currentKeys);
      mockCache.getTtl.mock.mockImplementation(() => 1000);
      mockCache.del.mock.mockImplementationOnce(() => 1);

      // Act
      cacheManager["_validateMemoryCapacity"](batchSize);

      // Assert
      assert.strictEqual(mockCache.del.mock.callCount(), 1);
      const deletedKeys = mockCache.del.mock.calls[0].arguments[0];
      assert.ok(Array.isArray(deletedKeys));
      assert.strictEqual(deletedKeys.length, expectedKeysToDelete);
    });

    test("Should sort keys by TTL and delete oldest first", () => {
      // Arrange
      const batchSize = 10;

      const testKeys = ["key0", "key1", "key2", "key3", "key4"];
      const ttlValues = [3000, 1000, 2000, 4000, 500]; // key4 (500) should be deleted first

      // Fill cache to near capacity to trigger cleanup
      const fullKeys = Array.from({ length: 997 }, (_, i) =>
        i < testKeys.length ? testKeys[i] : `filler${i}`,
      );

      mockCache.keys.mock.mockImplementationOnce(() => fullKeys);
      mockCache.getTtl.mock.mockImplementation((key) => {
        const index = testKeys.indexOf(key);
        return index !== -1 ? ttlValues[index] : 5000;
      });

      // Act
      cacheManager["_validateMemoryCapacity"](batchSize);

      // Assert
      assert.strictEqual(mockCache.del.mock.callCount(), 1);
      const deletedKeys = mockCache.del.mock.calls[0].arguments[0];
      assert.ok(Array.isArray(deletedKeys));

      // Should delete keys sorted by TTL (oldest first)
      // key4 (TTL: 500) should be the first in deleted keys
      assert.ok(deletedKeys.length > 0);
      assert.strictEqual(deletedKeys[0], "key4"); // Oldest key should be first
    });

    test("Should handle keys with 'undefined' TTL by using default TTL", () => {
      // Arrange
      const batchSize = 10;
      const currentKeys = Array.from({ length: 997 }, (_, i) => `key${i}`);

      mockCache.keys.mock.mockImplementationOnce(() => currentKeys);
      mockCache.getTtl.mock.mockImplementation(() => undefined);

      // Act & Assert
      assert.doesNotThrow(() =>
        cacheManager["_validateMemoryCapacity"](batchSize),
      );
    });

    test("Should throw 'CacheOperationError' when '_cache.del' throws", () => {
      // Arrange
      const batchSize = 10;

      mockCache.keys.mock.mockImplementationOnce(() =>
        Array.from({ length: 995 }, (_, i) => `key${i}`),
      );
      mockCache.getTtl.mock.mockImplementation(() => 1000);
      mockCache.del.mock.mockImplementationOnce(() => {
        throw new Error("Test error");
      });

      // Act & Assert
      assert.throws(() => {
        cacheManager["_validateMemoryCapacity"](batchSize);
      }, CacheOperationError);
    });
  });
});
