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

suite("Cache Manager 〖 Unit Tests 〗", () => {
  describe("Constructor", () => {
    test("Should create a new CacheManager instance with default config", () => {
      const namespace: Namespace = "product";
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
      const namespace: Namespace = "product";
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
    const namespace: Namespace = "product";
    let cacheManager: CacheManager;

    beforeEach(() => {
      cacheManager = new CacheManager(namespace);
    });

    test("Should return 'success' and 'data' when '_cache.set' returns 'true'", (t) => {
      // Arrange
      const key = "test-key";
      const value = "test-data";

      cacheManager["_validateMemoryCapacity"] = t.mock.fn(() => {});
      cacheManager["_validateSchema"] = t.mock.fn(() => ({ key, val: value }));
      cacheManager["_cache"].set = t.mock.fn(() => true);

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
      cacheManager["_cache"].set = t.mock.fn(() => false);

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
      cacheManager["_cache"].set = t.mock.fn(() => true);

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
      cacheManager["_cache"].set = t.mock.fn(() => false);

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
      cacheManager["_cache"].set = t.mock.fn(() => false);

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
      cacheManager["_cache"].set = t.mock.fn(() => {
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
    const namespace: Namespace = "product";
    let cacheManager: CacheManager;

    beforeEach(() => {
      cacheManager = new CacheManager(namespace);
    });

    test("Should return 'array' of 'success' and 'data' when '_cache.setMany' returns 'true''", (t) => {
      // Arrange
      const key = "test-key";
      const val = "test-value";

      cacheManager["_validateMemoryCapacity"] = t.mock.fn(() => {});
      cacheManager["_validateSchema"] = t.mock.fn(() => [{ key, val }]);
      cacheManager["_generateCacheKey"] = t.mock.fn(() => key);
      cacheManager["_cache"].set = t.mock.fn(() => true);

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
      cacheManager["_cache"].set = t.mock.fn(() => false);

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
      cacheManager["_cache"].set = t.mock.fn(() => true);

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
      cacheManager["_cache"].set = t.mock.fn(() => false);

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
      cacheManager["_cache"].set = t.mock.fn(() => false);

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
      cacheManager["_cache"].set = t.mock.fn(() => {
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
    const namespace: Namespace = "product";
    let cacheManager: CacheManager;

    beforeEach(() => {
      cacheManager = new CacheManager(namespace);
    });

    test("Should return 'success' and 'data' when '_cache.get' returns data", (t) => {
      // Arrange
      const key = "test-key";
      const value = "test-data";

      cacheManager["_validateSchema"] = t.mock.fn(() => key);
      cacheManager["_cache"].get = t.mock.fn(() => value as any);

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
      cacheManager["_cache"].get = t.mock.fn(() => undefined);

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
      cacheManager["_cache"].get = t.mock.fn(() => value as any);

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
      cacheManager["_cache"].get = t.mock.fn(() => undefined);

      // Act
      const result = cacheManager.get({ key });

      // Assert
      assert.ok(!result.success);
      assert.strictEqual(result.key, `${namespace}:${key}`);
    });

    test("Should return 'error' instance of 'CacheOperationError' when '_cache.get' returns 'undefined'", (t) => {
      // Arrange
      const key = "test-key";
      const value = "test-data";

      cacheManager["_validateSchema"] = t.mock.fn(() => key);
      cacheManager["_cache"].get = t.mock.fn(() => undefined);

      // Act
      const result = cacheManager.get({ key });

      // Assert
      assert.ok(!result.success);
      assert.ok(result.error instanceof CacheOperationError);
    });

    test("Should return 'error' instance of 'CacheOperationError' when '_cache.get' throws", (t) => {
      // Arrange
      const key = "test-key";
      const value = "test-data";

      cacheManager["_validateSchema"] = t.mock.fn(() => key);
      cacheManager["_cache"].get = t.mock.fn(() => {
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
    const namespace: Namespace = "product";
    let cacheManager: CacheManager;

    beforeEach(() => {
      cacheManager = new CacheManager(namespace);
    });

    test("Should return 'array' of 'success' and 'data' when '_cache.getMany' returns data", (t) => {
      // Arrange
      const key = "test-key";
      const value = "test-value";

      cacheManager["_validateSchema"] = t.mock.fn(() => [key]);
      cacheManager["_generateCacheKey"] = t.mock.fn(() => key);
      cacheManager["_cache"].get = t.mock.fn(() => value as any);

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
      cacheManager["_cache"].get = t.mock.fn(() => undefined);

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
      cacheManager["_cache"].get = t.mock.fn(() => value as any);

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
      cacheManager["_cache"].get = t.mock.fn(() => undefined);

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
      cacheManager["_cache"].get = t.mock.fn(() => undefined);

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
      cacheManager["_cache"].get = t.mock.fn(() => {
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
    const namespace: Namespace = "product";
    let cacheManager: CacheManager;

    beforeEach(() => {
      cacheManager = new CacheManager(namespace);
    });

    test("Should return 'success' and 'data' when '_cache.delete' returns '1'", (t) => {
      // Arrange
      const key = "test-key";

      cacheManager["_validateSchema"] = t.mock.fn(() => key);
      cacheManager["_generateCacheKey"] = t.mock.fn(() => key);
      cacheManager["_cache"].del = t.mock.fn(() => 1);

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
      cacheManager["_cache"].del = t.mock.fn(() => 0);

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
      cacheManager["_cache"].del = t.mock.fn(() => 1);

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
      cacheManager["_cache"].del = t.mock.fn(() => 0);

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
      cacheManager["_cache"].del = t.mock.fn(() => 0);

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
      cacheManager["_cache"].del = t.mock.fn(() => {
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
    const namespace: Namespace = "product";
    let cacheManager: CacheManager;

    beforeEach(() => {
      cacheManager = new CacheManager(namespace);
    });

    test("Should return 'array' of 'success' and 'data' when '_cache.deleteMany' returns '1'", (t) => {
      // Arrange
      const key = "test-key";

      cacheManager["_validateSchema"] = t.mock.fn(() => [key]);
      cacheManager["_generateCacheKey"] = t.mock.fn(() => key);
      cacheManager["_cache"].del = t.mock.fn(() => 1);

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
      cacheManager["_cache"].del = t.mock.fn(() => 0);

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
      cacheManager["_cache"].del = t.mock.fn(() => 1);

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
      cacheManager["_cache"].del = t.mock.fn(() => 0);

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
      cacheManager["_cache"].del = t.mock.fn(() => 0);

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
      cacheManager["_cache"].del = t.mock.fn(() => {
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
    const namespace: Namespace = "product";
    let cacheManager: CacheManager;

    beforeEach(() => {
      cacheManager = new CacheManager(namespace);
    });

    test("Should return 'success' and 'data' when '_cache.take' returns data", (t) => {
      // Arrange
      const key = "test-key";
      const value = "test-value";

      cacheManager["_validateSchema"] = t.mock.fn(() => key);
      cacheManager["_generateCacheKey"] = t.mock.fn(() => key);
      cacheManager["_cache"].take = t.mock.fn(() => value as any);

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
      cacheManager["_cache"].take = t.mock.fn(() => undefined);

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
      cacheManager["_cache"].take = t.mock.fn(() => value as any);

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
      cacheManager["_cache"].take = t.mock.fn(() => undefined);

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
      cacheManager["_cache"].take = t.mock.fn(() => undefined);

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
      cacheManager["_cache"].take = t.mock.fn(() => {
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
    let cacheManager: CacheManager;
    const namespace: Namespace = "user";

    beforeEach(() => {
      cacheManager = new CacheManager(namespace);
    });

    test("Should throw 'CacheOperationError' when '_cache.flushAll' throws", (t) => {
      cacheManager["_cache"].flushAll = t.mock.fn(() => {
        throw new Error();
      });

      assert.throws(() => {
        cacheManager.flush();
      }, CacheOperationError);
    });
  });

  describe("getStats", () => {
    const namespace: Namespace = "user";
    let cacheManager: CacheManager;

    beforeEach(() => {
      cacheManager = new CacheManager(namespace);
    });

    test("Should return 'hits', 'misses', 'numberOfKeys', 'keysSize', and 'valuesSize' when '_cache.getStats' is called", (t) => {
      // Arrange
      const stats = {
        hits: 1,
        misses: 1,
        keys: 1,
        ksize: 1,
        vsize: 1,
      };

      cacheManager["_cache"].getStats = t.mock.fn(() => stats);

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

      cacheManager["_cache"].getStats = t.mock.fn(() => stats);

      // Act
      const result = cacheManager.getStats();

      // Assert
      assert.strictEqual(result.totalSize, stats.ksize + stats.vsize);
    });
  });

  describe("isKeyCached", () => {
    const namespace: Namespace = "product";
    let cacheManager: CacheManager;

    beforeEach(() => {
      cacheManager = new CacheManager(namespace);
    });

    test("Should return 'success' and 'data' when '_cache.has' returns 'true'", (t) => {
      // Arrange
      const key = "test-key";

      cacheManager["_validateSchema"] = t.mock.fn(() => key);
      cacheManager["_generateCacheKey"] = t.mock.fn(() => key);
      cacheManager["_cache"].has = t.mock.fn(() => true);

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
      cacheManager["_cache"].has = t.mock.fn(() => false);

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
      cacheManager["_cache"].has = t.mock.fn(() => true);

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
      cacheManager["_cache"].has = t.mock.fn(() => false);

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
      cacheManager["_cache"].has = t.mock.fn(() => false);

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
      cacheManager["_cache"].has = t.mock.fn(() => {
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
    const namespace: Namespace = "user";
    let cacheManager: CacheManager;

    beforeEach(() => {
      cacheManager = new CacheManager(namespace);
    });

    test("Should add 'namespace' as a prefix to the key", (t) => {
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
    const namespace: Namespace = "user";
    let cacheManager: CacheManager;

    beforeEach(() => {
      cacheManager = new CacheManager(namespace);
    });

    test("Should take 'schema' and 'data' and return the correct data", (t) => {
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

    test("Should throw 'CacheValidationError' when 'data.key' is invalid", (t) => {
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

    test("Should throw 'CacheValidationError' when 'data.key' is invalid", (t) => {
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
    const namespace: Namespace = "user";
    let cacheManager: CacheManager;

    beforeEach(() => {
      cacheManager = new CacheManager(namespace);
    });

    function populateCache(numberOfKeys: number) {
      const now = Date.now();

      const items = Array(numberOfKeys)
        .fill(0)
        .map((_, i) => ({
          key: `user:test-key-${i}`,
          val: `test-val-${i}`,
          ttl: now + i * 1000, // ascending order
        }));

      cacheManager["_cache"].mset(items);

      return items;
    }

    function validateMemoryCapacity(batchSize: number) {
      cacheManager["_validateMemoryCapacity"](batchSize);
    }

    describe("Early Return Scenarios", () => {
      test("Should return early when batchSize is 0", () => {
        // Arrange
        const initialKeyCount = populateCache(5).length;

        // Act & Assert
        assert.doesNotThrow(() => validateMemoryCapacity(0));

        const finalKeyCount = cacheManager["_cache"].keys().length;
        assert.strictEqual(finalKeyCount, initialKeyCount);
      });

      test("Should return early when cache is empty", () => {
        // Act & Assert
        assert.doesNotThrow(() => validateMemoryCapacity(100));
      });

      test("Should return early when sufficient space is available", () => {
        // Arrange
        const initialKeyCount = populateCache(10).length;
        const batchSize = 5;
        const availableSpace = MAX_CACHE_SIZE - initialKeyCount;

        // Act & Assert
        assert.doesNotThrow(() => validateMemoryCapacity(batchSize));

        const finalKeyCount = cacheManager["_cache"].keys().length;
        assert.strictEqual(finalKeyCount, initialKeyCount);
      });
    });

    describe("Error Scenarios", () => {
      test("Should throw 'CacheCapacityError' when batchSize exceeds MAX_CACHE_SIZE", () => {
        // Arrange
        const invalidBatchSize = MAX_CACHE_SIZE + 1;

        // Act & Assert
        assert.throws(
          () => validateMemoryCapacity(invalidBatchSize),
          CacheCapacityError,
        );
      });

      test("Should throw 'CacheOperationError' when '_cache.del' throws", (t) => {
        // Arrange
        populateCache(MAX_CACHE_SIZE - 1);

        cacheManager["_cache"].del = t.mock.fn(() => {
          throw new Error();
        });

        // Act & Assert
        assert.throws(() => validateMemoryCapacity(5), CacheOperationError);
      });
    });

    describe("Cache Eviction Logic", () => {
      test("Should delete keys when available space is insufficient", () => {
        // Arrange
        const initialCount = 990;
        const batchSize = 20; // Needs 10 items to be deleted (990 + 20 - 1000)
        populateCache(initialCount);

        // Act
        validateMemoryCapacity(batchSize);

        // Assert
        const finalKeyCount = cacheManager["_cache"].keys().length;
        assert.ok(finalKeyCount < initialCount);
      });

      test("Should use fallback space (10%) when spaceNeeded is small", () => {
        // Arrange
        const initialCount = 100;
        const batchSize = MAX_CACHE_SIZE - initialCount + 1; // Need to delete 1 key
        const expectedFallbackKeys = Math.ceil(initialCount * 0.1); // 10 keys
        const initialKeyCount = populateCache(initialCount).length;

        // Act
        validateMemoryCapacity(batchSize);

        // Assert
        const finalKeyCount = cacheManager["_cache"].keys().length;
        const deletedCount = initialKeyCount - finalKeyCount;
        assert.strictEqual(deletedCount, expectedFallbackKeys);
      });

      test("Should delete keys in TTL order (oldest first)", () => {
        // Arrange
        const numberOfKeys = 999;
        const batchSize = 3;
        const items = populateCache(numberOfKeys);

        // Act
        validateMemoryCapacity(batchSize);

        // Assert
        const remainingKeys = cacheManager["_cache"].keys();
        assert.notStrictEqual(items.length, remainingKeys.length);
        // check the first 100 keys are deleted
        assert.ok(!remainingKeys.includes(items[0].key));
        assert.ok(!remainingKeys.includes(items[99].key));
        // check the rest of the keys are not deleted
        assert.ok(remainingKeys.includes(items[100].key));
        assert.ok(remainingKeys.includes(items[400].key));
        assert.ok(remainingKeys.includes(items[800].key));
      });
    });

    describe("Edge Cases and Boundary Conditions", () => {
      test("Should handle batchSize exactly equal to MAX_CACHE_SIZE", () => {
        // Act & Assert
        assert.doesNotThrow(() => validateMemoryCapacity(MAX_CACHE_SIZE));
      });

      test("Should handle cache at exact capacity", () => {
        // Arrange
        const maxSize = MAX_CACHE_SIZE - 1; // NodeCache throws if you try to populate at max size
        const batchSize = 1;
        const expectedDeleteCount = Math.max(1, Math.ceil(maxSize * 0.1));
        populateCache(maxSize);

        // Act
        validateMemoryCapacity(batchSize);

        // Assert
        const finalKeyCount = cacheManager["_cache"].keys().length;
        assert.strictEqual(finalKeyCount, maxSize - expectedDeleteCount);
      });

      test("Should delete correct number when spaceNeeded equals fallbackSpace", () => {
        // Arrange
        const initialCount = 100;
        const spaceNeeded = Math.ceil(initialCount * 0.1); // 10
        const batchSize = MAX_CACHE_SIZE - initialCount + spaceNeeded; // Need to delete exactly 10
        populateCache(initialCount);
        const initialKeyCount = cacheManager["_cache"].keys().length;

        // Act
        validateMemoryCapacity(batchSize);

        // Assert
        const finalKeyCount = cacheManager["_cache"].keys().length;
        const deletedCount = initialKeyCount - finalKeyCount;
        assert.strictEqual(deletedCount, spaceNeeded);
      });

      test("Should handle large batch deletions correctly", () => {
        // Arrange
        const initialCount = 800;
        const batchSize = 400; // Need to delete 200 keys
        const expectedDeleteCount = batchSize - (MAX_CACHE_SIZE - initialCount);
        populateCache(initialCount);

        // Act
        validateMemoryCapacity(batchSize);

        // Assert
        const finalKeyCount = cacheManager["_cache"].keys().length;
        const deletedCount = initialCount - finalKeyCount;

        assert.ok(deletedCount >= expectedDeleteCount);
        assert.ok(finalKeyCount + batchSize <= MAX_CACHE_SIZE);
      });
    });
  });
});
