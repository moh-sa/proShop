import assert from "node:assert";
import test, { beforeEach, describe, suite } from "node:test";
import { DEFAULT_CACHE_CONFIG } from "../../config";
import { DatabaseError } from "../../errors";
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

    test("Should set a value", () => {
      const key = "test-key";
      const value = { data: "test-data" };

      const setResult = cacheManager.set({ key, value });
      assert.strictEqual(setResult, true);
    });

    test("set should throw 'DatabaseError' if NodeCache.set throws", (t) => {
      const key = "error-key";
      const value = "error-value";

      cacheManager["_cache"].set = t.mock.fn(() => {
        throw new Error();
      });

      assert.throws(() => {
        cacheManager.set({ key, value });
      }, Error);
    });
  });

  describe("Get", () => {
    const namespace: Namespace = "product";
    let cacheManager: CacheManager;

    beforeEach(() => {
      cacheManager = new CacheManager(namespace);
    });

    test("Should get a value", () => {
      const key = "test-key";
      const value = { data: "test-data" };
      cacheManager.set({ key, value });

      const retrievedValue = cacheManager.get({ key });
      assert.deepStrictEqual(retrievedValue, value);
    });

    test("'get' should return undefined for non-existent key", () => {
      const retrievedValue = cacheManager.get({ key: "non-existent-key" });

      assert.strictEqual(retrievedValue, undefined);
    });

    test("'get' should throw 'DatabaseError' if NodeCache.get throws", (t) => {
      const key = "error-key";

      cacheManager["_cache"].get = t.mock.fn(() => {
        throw new Error();
      });

      assert.throws(() => {
        cacheManager.get({ key });
      }, Error);
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

    test("delete should throw 'DatabaseError' if NodeCache.del throws", (t) => {
      const key = "error-key";

      cacheManager["_cache"].del = t.mock.fn(() => {
        throw new Error();
      });

      assert.throws(() => {
        cacheManager.delete({ key });
      }, Error);
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
        assert.strictEqual(cacheManager.get({ key }), undefined);
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
