import NodeCache from "node-cache";
import { z } from "zod";
import { DEFAULT_CACHE_CONFIG, MAX_CACHE_SIZE } from "../config";
import { DatabaseError, ValidationError } from "../errors";
import {
  cacheItemSchema,
  cacheItemsSchema,
  cacheKeySchema,
  cacheKeysSchema,
} from "../schemas";
import {
  CacheConfig,
  CacheItem,
  CacheItems,
  CacheStats,
  Namespace,
} from "../types";
import { formatZodErrors } from "../utils";

export interface ICacheManager {
  set(args: CacheItem): boolean;
  setMany(args: CacheItems): Array<boolean>;
  get<T>(args: { key: string }): T | undefined;
  getMany<T>(args: { keys: Array<string> }): Record<string, T | undefined>;
  delete(args: { key: string }): true;
  deleteMany(args: { keys: Array<string> }): true;
  take<T>(args: { key: string }): T | undefined;
  flushStats(): void;
  flush(): void;
  getStats(): CacheStats;
  getKeys(): Array<string>;
  isKeyCached(args: { key: string }): boolean;
}

export class CacheManager implements ICacheManager {
  private _cache: NodeCache;
  private readonly _namespace: Namespace;

  constructor(namespace: Namespace, config?: Partial<CacheConfig>) {
    this._namespace = namespace;
    this._cache = new NodeCache({
      ...DEFAULT_CACHE_CONFIG,
      ...config,
    });
  }

  set(args: CacheItem): boolean {
    const parsedArgs = this._validateSchema({
      schema: cacheItemSchema,
      data: {
        key: args.key,
        val: args.value,
        ttl: args.ttl ?? DEFAULT_CACHE_CONFIG.stdTTL,
      },
    });

    this._validateMemoryCapacity(1);

    const key = this._generateCacheKey({ id: parsedArgs.key });

    try {
      return this._cache.set(key, parsedArgs.val, parsedArgs.ttl);
    } catch (error) {
      console.error("Failed to set key", key);
      return false;
    }
  }

  setMany(args: CacheItems): Array<boolean> {
    const preparedArgs = args.map((item) => ({
      key: this._generateCacheKey({ id: item.key }),
      val: item.value,
      ttl: item.ttl ?? DEFAULT_CACHE_CONFIG.stdTTL,
    }));

    this._validateMemoryCapacity(args.length);

    const parsedArgs = this._validateSchema({
      schema: cacheItemsSchema,
      data: preparedArgs,
    });

    return parsedArgs.map((arg) => {
      try {
        return this._cache.set(arg.key, arg.val, arg.ttl);
      } catch (error) {
        console.error("Failed to set key", arg.key);
        return false;
      }
    });
  }

  get<T>(args: { key: string }): T | undefined {
    const parsedKey = this._validateSchema({
      schema: cacheKeySchema,
      data: args.key,
    });
    const key = this._generateCacheKey({ id: parsedKey });

    const value = this._cache.get<T>(key);
    if (!value) {
      console.log("Cache miss:", args.key);
      return undefined;
    }

    console.log("Cache hit:", args.key);
    return value;
  }

  getMany<T>(args: { keys: Array<string> }): Record<string, T | undefined> {
    const parsedKeys = this._validateSchema({
      schema: cacheKeysSchema,
      data: args.keys,
    });

    const keys = parsedKeys.map((key) => this._generateCacheKey({ id: key }));
    const values = this._cache.mget<T>(keys);

    return values;
  }

  delete(args: { key: string }): true {
    const parsedKey = this._validateSchema({
      schema: cacheKeySchema,
      data: args.key,
    });
    const key = this._generateCacheKey({ id: parsedKey });

    const isDeleted = this._cache.del(key);
    if (!isDeleted) {
      console.error("Failed to delete key", key);
      throw new Error("Failed to delete key");
    }

    return true;
  }

  deleteMany(args: { keys: Array<string> }): true {
    const parsedKeys = this._validateSchema({
      schema: cacheKeysSchema,
      data: args.keys,
    });

    const cacheKeys = parsedKeys.map((key) =>
      this._generateCacheKey({ id: key }),
    );
    const isKeysCached = cacheKeys.map((key) => this._cache.has(key));
    if (isKeysCached.some((isCached) => !isCached)) {
      const notCachedKeys = cacheKeys.filter(
        (_, index) => !isKeysCached[index],
      );
      console.error("Failed to delete keys", notCachedKeys);
      throw new Error("Failed to delete keys");
    }

    const isKeysDeleted = this._cache.del(cacheKeys);
    if (isKeysDeleted !== cacheKeys.length) {
      const notCachedKeysBool = cacheKeys.map((key) => this._cache.has(key));
      const notDeletedKeys = cacheKeys.filter(
        (_, index) => !notCachedKeysBool[index],
      );

      console.error("Failed to delete keys", notDeletedKeys);
      throw new Error("Failed to delete keys");
    }

    return true;
  }

  take<T>(args: { key: string }): T | undefined {
    const parsedKey = this._validateSchema({
      schema: cacheKeySchema,
      data: args.key,
    });

    const key = this._generateCacheKey({ id: parsedKey });
    const value = this._cache.take(key);
    if (!value) {
      console.log("Cache miss:", args.key);
      return undefined;
    }

    return value as T;
  }

  flushStats(): void {
    this._cache.flushStats();
  }

  flush(): void {
    try {
      this._cache.flushAll();
      console.log("Cache flushed");
    } catch (error) {
      console.error(error);
      throw new DatabaseError();
    }
  }

  getStats(): CacheStats {
    const stats = this._cache.getStats();
    return {
      hits: stats.hits,
      misses: stats.misses,
      numberOfKeys: stats.keys,
      keysSize: stats.ksize,
      valuesSize: stats.vsize,
      totalSize: stats.vsize + stats.ksize,
    };
  }

  getKeys(): Array<string> {
    return this._cache.keys();
  }

  isKeyCached(args: { key: string }): boolean {
    const parsedKey = this._validateSchema({
      schema: cacheKeySchema,
      data: args.key,
    });

    const key = this._generateCacheKey({ id: parsedKey });
    return this._cache.has(key);
  }

  private _generateCacheKey({ id }: { id: string }): string {
    return `${this._namespace}:${id}`;
  }

  private _validateMemoryCapacity(batchSize: number): void {
    if (batchSize === 0) return;
    if (batchSize > MAX_CACHE_SIZE)
      throw new Error(`Batch size (${batchSize}) exceeds max cache size`);

    const currentKeys = this._cache.keys();
    const usedCacheSpace = currentKeys.length;
    if (usedCacheSpace === 0) return;

    const availableSpace = MAX_CACHE_SIZE - usedCacheSpace;
    if (availableSpace >= batchSize) return;

    const spaceNeeded = batchSize - availableSpace;
    const fallbackSpace = Math.ceil(usedCacheSpace * 0.1); // 10% of current keys size
    const keysToDeleteCount = Math.max(spaceNeeded, fallbackSpace);

    // NodeCache doesn't support LRU (least recently used)
    // so we sort by TTL and delete the oldest keys
    const keysByTTL = currentKeys
      .map((key) => ({
        key,
        ttl: this._cache.getTtl(key) ?? DEFAULT_CACHE_CONFIG.stdTTL,
      }))
      .sort((a, b) => a.ttl - b.ttl)
      .map((entity) => entity.key);

    const keysToDelete = keysByTTL.slice(0, keysToDeleteCount);
    this._cache.del(keysToDelete);

    console.log(`[Cache] Deleted ${keysToDelete.length} keys`, keysToDelete);
  }

  private _validateSchema<T extends z.ZodType>(args: {
    schema: T;
    data: z.infer<T>;
  }): z.infer<T> {
    const parsed = args.schema.safeParse(args.data);
    if (!parsed.success) {
      const errorMessage = formatZodErrors(parsed.error);
      throw new ValidationError(errorMessage); // TODO: replace with cache-specific error (?)
    }

    return parsed.data;
  }
}
