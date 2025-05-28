import assert from "node:assert";
import test, { beforeEach, describe, mock, suite } from "node:test";
import { DatabaseError } from "../../errors";
import { CacheManager } from "../../managers";
import { CacheConfig, Namespace } from "../../types";

suite("Cache Manager 〖 Unit Tests 〗", () => {
  const mockConsoleLog = mock.method(console, "log", () => {});
  const mockConsoleError = mock.method(console, "error", () => {});

  beforeEach(() => {
    mockConsoleLog.mock.resetCalls();
    mockConsoleError.mock.resetCalls();
  });

  describe("Constructor", () => {
    test("Should create a new CacheManager instance with default config", () => {
      const namespace: Namespace = "product";
      const cacheManager = new CacheManager(namespace);

      assert.ok(cacheManager);
      assert.ok(cacheManager instanceof CacheManager);
      assert.strictEqual(cacheManager["namespace"], namespace);
      assert.strictEqual(cacheManager["cache"].options.stdTTL, 0);
    });

    test("Should create a new CacheManager instance with custom config", () => {
      const namespace: Namespace = "product";
      const cacheConfig: Partial<CacheConfig> = { stdTTL: 1000 };
      const cacheManager = new CacheManager(namespace, cacheConfig);

      assert.ok(cacheManager);
      assert.ok(cacheManager instanceof CacheManager);
      assert.strictEqual(cacheManager["namespace"], namespace);
      assert.strictEqual(
        cacheManager["cache"].options.stdTTL,
        cacheConfig.stdTTL,
      );
    });
  });

  describe("getInstance", () => {
    test("'getInstance' should return a public cache manager with only flush method", () => {
      const namespace: Namespace = "product";
      const cacheManager = CacheManager.getInstance(namespace);

      assert.ok(cacheManager);
      assert.strictEqual(Object.keys(cacheManager).length, 1);
      assert.strictEqual(Object.keys(cacheManager).includes("flush"), true);
    });

    test("'getInstance' should return the same instance for the same namespace", () => {
      const namespace: Namespace = "product";
      CacheManager.getInstance(namespace);
      CacheManager.getInstance(namespace);

      const instances = (CacheManager as any).instances;
      assert.strictEqual(Object.keys(instances).length, 1);
      assert.strictEqual(Object.keys(instances).includes(namespace), true);
    });

    test("'getInstance' should return different instances for different namespaces", () => {
      const namespace1: Namespace = "product";
      const namespace2: Namespace = "user";
      CacheManager.getInstance(namespace1);
      CacheManager.getInstance(namespace2);

      const instances = CacheManager["instances"];

      assert.strictEqual(Object.keys(instances).length, 2);
      assert.strictEqual(Object.keys(instances).includes(namespace1), true);
      assert.strictEqual(Object.keys(instances).includes(namespace2), true);
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

      assert.strictEqual(mockConsoleLog.mock.calls.length, 1);
      assert.strictEqual(
        mockConsoleLog.mock.calls[0].arguments[0],
        "cache set",
      );
    });

    test("set should throw 'DatabaseError' if NodeCache.set throws", (t) => {
      const key = "error-key";
      const value = "error-value";

      cacheManager["cache"].set = t.mock.fn(() => {
        throw new Error();
      });

      assert.throws(() => {
        cacheManager.set({ key, value });
      }, DatabaseError);

      assert.strictEqual(mockConsoleError.mock.calls.length, 1);
      assert.ok(mockConsoleError.mock.calls[0].arguments[0] instanceof Error);
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

      assert.strictEqual(mockConsoleLog.mock.calls.length, 2);
      assert.strictEqual(
        mockConsoleLog.mock.calls[1].arguments[0],
        "Cache hit:",
      );
    });

    test("'get' should return undefined for non-existent key", () => {
      const retrievedValue = cacheManager.get({ key: "non-existent-key" });

      assert.strictEqual(retrievedValue, undefined);

      assert.strictEqual(mockConsoleLog.mock.calls.length, 1);
      assert.strictEqual(
        mockConsoleLog.mock.calls[0].arguments[0],
        "Cache miss:",
      );
    });

    test("'get' should throw 'DatabaseError' if NodeCache.get throws", (t) => {
      const key = "error-key";

      cacheManager["cache"].get = t.mock.fn(() => {
        throw new Error();
      });

      assert.throws(() => {
        cacheManager.get({ key });
      }, DatabaseError);

      assert.strictEqual(mockConsoleError.mock.calls.length, 1);
      assert.ok(mockConsoleError.mock.calls[0].arguments[0] instanceof Error);
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
      const deleteResult = cacheManager.delete({ keys: key });

      assert.strictEqual(deleteResult, 1);

      assert.strictEqual(mockConsoleLog.mock.calls.length, 2);
      assert.strictEqual(
        mockConsoleLog.mock.calls[1].arguments[0],
        "Cache delete",
      );
    });

    test("Should delete multiple keys", () => {
      const keys = ["delete-key-1", "delete-key-2"];
      const values = ["delete-value-1", "delete-value-2"];

      keys.forEach((key, index) => {
        cacheManager.set({ key, value: values[index] });
      });

      const deleteResult = cacheManager.delete({ keys });

      assert.strictEqual(deleteResult, keys.length);

      assert.strictEqual(mockConsoleLog.mock.calls.length, 3);
      assert.strictEqual(
        mockConsoleLog.mock.calls[2].arguments[0],
        "Cache delete",
      );

      assert.strictEqual(cacheManager.get({ key: keys[0] }), undefined);
      assert.strictEqual(cacheManager.get({ key: keys[1] }), undefined);
    });

    test("delete should throw 'DatabaseError' if NodeCache.del throws", (t) => {
      const key = "error-key";

      cacheManager["cache"].del = t.mock.fn(() => {
        throw new Error();
      });

      assert.throws(() => {
        cacheManager.delete({ keys: key });
      }, DatabaseError);

      assert.strictEqual(mockConsoleError.mock.calls.length, 1);
      assert.ok(mockConsoleError.mock.calls[0].arguments[0] instanceof Error);
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

      assert.strictEqual(mockConsoleLog.mock.calls.length, 3);
      assert.strictEqual(
        mockConsoleLog.mock.calls[2].arguments[0],
        "Cache flushed",
      );

      keys.forEach((key) => {
        assert.strictEqual(cacheManager.get({ key }), undefined);
      });
    });

    test("'flush' via 'getInstance' should work", () => {
      const key = "flush-key";
      const publicCacheInstance = CacheManager.getInstance(namespace);

      cacheManager.set({ key, value: "value1" });

      publicCacheInstance.flush();
      assert.strictEqual(mockConsoleLog.mock.calls.length, 2);
      assert.strictEqual(
        mockConsoleLog.mock.calls[1].arguments[0],
        "Cache flushed",
      );

      assert.strictEqual(cacheManager.get({ key }), undefined);
    });

    test("'flush' should throw 'DatabaseError' if NodeCache.flushAll throws", (t) => {
      cacheManager["cache"].flushAll = t.mock.fn(() => {
        throw new Error();
      });

      assert.throws(() => {
        cacheManager.flush();
      }, DatabaseError);

      assert.strictEqual(mockConsoleError.mock.calls.length, 1);
      assert.ok(mockConsoleError.mock.calls[0].arguments[0] instanceof Error);
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

      const stats = cacheManager.stats();

      assert.strictEqual(stats.hits, 1);
      assert.strictEqual(stats.misses, 1);
      assert.strictEqual(stats.keys, 1);
      assert.ok(typeof stats.ksize === "number");
      assert.ok(typeof stats.ksize === "number");
    });
  });

  describe("Key Generation", () => {
    const namespace: Namespace = "rate-limit";
    let cacheManager: CacheManager;

    beforeEach(() => {
      cacheManager = new CacheManager(namespace);
    });

    test("'generateKey' should create a namespace-prefixed key", () => {
      const generatedKey = cacheManager.generateKey({ id: "123" });

      assert.ok(generatedKey.startsWith(namespace));
    });
  });

  describe(
    "Full Cache Handling - Delete Least Used Keys",
    { todo: "figure out how to lower the max-cache-size in tests" },
    () => {},
  );
});
