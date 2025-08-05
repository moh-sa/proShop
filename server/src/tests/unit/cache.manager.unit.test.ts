import assert from "node:assert";
import test, { beforeEach, describe, suite } from "node:test";
import { DEFAULT_CACHE_CONFIG } from "../../config";
import { CacheOperationError, DatabaseError } from "../../errors";
import { CacheManager } from "../../managers";
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

    test("Should delete a key", () => {
      const key = "delete-key";
      const value = "delete-value";

      cacheManager.set({ key, value });
      const deleteResult = cacheManager.delete({ key });

      assert.ok(deleteResult);
    });

    // FIXME: fix this test
    test(
      "Should delete multiple keys",
      { todo: "fix this test", skip: true },
      () => {
        const keys = ["delete-key-1", "delete-key-2"];
        const values = ["delete-value-1", "delete-value-2"];

        keys.forEach((key, index) => {
          cacheManager.set({ key, value: values[index] });
        });

        // const deleteResult = cacheManager.delete({ keys });

        // assert.strictEqual(deleteResult, keys.length);

        assert.strictEqual(cacheManager.get({ key: keys[0] }), undefined);
        assert.strictEqual(cacheManager.get({ key: keys[1] }), undefined);
      },
    );

    test("Should return 'false' if 'NodeCache.del' tries to remove a non-existent key", (t) => {
      const key = "delete-key";

      cacheManager["_cache"].del = t.mock.fn(() => 0);

      const deleteResult = cacheManager.delete({ key });
      assert.strictEqual(deleteResult, false);
    });

    test("Should return 'false' if 'NodeCache.del' returns 0", (t) => {
      const key = "delete-key";
      const value = "delete-value";
      cacheManager.set({ key, value });

      cacheManager["_cache"].del = t.mock.fn(() => 0);

      const deleteResult = cacheManager.delete({ key });
      assert.strictEqual(deleteResult, false);
    });

    test("Should return 'false' if 'NodeCache.del' throws", (t) => {
      const key = "error-key";

      cacheManager["_cache"].del = t.mock.fn(() => {
        throw new Error();
      });

      const deleteResult = cacheManager.delete({ key });
      assert.strictEqual(deleteResult, false);
    });
  });

  describe("Flush", () => {
    let cacheManager: CacheManager;
    const namespace: Namespace = "user";

    beforeEach(() => {
      cacheManager = new CacheManager(namespace);
    });

    test("'flush' should delete all the keys in the namespace", () => {
      const keys = ["key1", "key2"];
      const values = ["value1", "value2"];

      keys.forEach((key, index) => {
        cacheManager.set({ key, value: values[index] });
      });
      cacheManager.flush();

      keys.forEach((key) => {
        const result = cacheManager.get({ key });
        assert.strictEqual(result.success, false);
      });
    });

    test("'flush' should throw 'DatabaseError' if NodeCache.flushAll throws", (t) => {
      cacheManager["_cache"].flushAll = t.mock.fn(() => {
        throw new Error();
      });

      assert.throws(() => {
        cacheManager.flush();
      }, DatabaseError);
    });
  });

  describe("Stats", () => {
    const namespace: Namespace = "order";
    let cacheManager: CacheManager;

    beforeEach(() => {
      cacheManager = new CacheManager(namespace);
    });

    test("stats should return cache statistics", () => {
      const key = "stats-key";
      const value = "stats-value";

      cacheManager.set({ key, value });
      cacheManager.get({ key }); // hit
      cacheManager.get({ key: "non-existent-key" }); // miss

      const stats = cacheManager.getStats();

      assert.strictEqual(stats.hits, 1);
      assert.strictEqual(stats.misses, 1);
      assert.strictEqual(stats.numberOfKeys, 1);
      assert.ok(typeof stats.keysSize === "number");
      assert.ok(typeof stats.valuesSize === "number");
    });
  });

  describe(
    "Full Cache Handling - Delete Least Used Keys",
    { todo: "figure out how to lower the max-cache-size in tests" },
    () => {},
  );
});
