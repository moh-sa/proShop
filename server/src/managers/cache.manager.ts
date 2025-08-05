import NodeCache from "node-cache";
import { z } from "zod";
import { DEFAULT_CACHE_CONFIG, MAX_CACHE_SIZE } from "../config";
import { CacheOperationError, DatabaseError, ValidationError } from "../errors";
import {
  cacheItemSchema,
  cacheItemsSchema,
  cacheKeySchema,
  cacheKeysSchema,
} from "../schemas";
import {
  CacheConfig,
  CacheFailureResult,
  CacheItem,
  CacheItems,
  CacheResult,
  CacheStats,
  CacheSuccessResult,
  Namespace,
} from "../types";
import { formatZodErrors } from "../utils";

export interface ICacheManager {
  set(args: CacheItem): CacheResult;
  setMany(args: CacheItems): Array<CacheResult>;
  get<T>(args: { key: string }): CacheResult<T>;
  getMany<T>(args: { keys: Array<string> }): Array<CacheResult<T>>;
  delete(args: { key: string }): boolean;
  deleteMany(args: { keys: Array<string> }): Array<boolean>;
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

  set(args: CacheItem): CacheResult {
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
      const result = this._cache.set(key, parsedArgs.val, parsedArgs.ttl);
      if (!result) {
        console.error("Failed to set key", key);
        return this._createFailureResult(key, CacheOperationError.set(key));
      }

      return this._createSuccessResult(key);
    } catch (error) {
      console.error("Failed to set key", key);
      return this._createFailureResult(
        key,
        CacheOperationError.set(key, error),
      );
    }
  }

  setMany(args: CacheItems): Array<CacheResult> {
    this._validateMemoryCapacity(args.length);

    const parsedArgs = this._validateSchema({
      schema: cacheItemsSchema,
      data: args.map((arg) => ({
        key: arg.key,
        val: arg.value,
        ttl: arg.ttl ?? DEFAULT_CACHE_CONFIG.stdTTL,
      })),
    });

    const parsedArgsWithCacheKeys = parsedArgs.map((arg) => ({
      ...arg,
      key: this._generateCacheKey({ id: arg.key }),
    }));

    return parsedArgsWithCacheKeys.map((arg) => {
      try {
        const result = this._cache.set(arg.key, arg.val, arg.ttl);
        if (!result) {
          console.error("Failed to set key", arg.key);
          return this._createFailureResult(
            arg.key,
            CacheOperationError.set(arg.key),
          );
        }

        return this._createSuccessResult(arg.key);
      } catch (error) {
        console.error("Failed to set key", arg.key);
        return this._createFailureResult(
          arg.key,
          CacheOperationError.set(arg.key, error),
        );
      }
    });
  }

  get<T>(args: { key: string }): CacheResult<T> {
    const parsedKey = this._validateSchema({
      schema: cacheKeySchema,
      data: args.key,
    });
    const key = this._generateCacheKey({ id: parsedKey });

    try {
      const result = this._cache.get<T>(key);
      if (!result) {
        console.log("Cache miss:", args.key);
        return this._createFailureResult(key, CacheOperationError.get(key));
      }

      console.log("Cache hit:", args.key);
      return this._createSuccessResult(result);
    } catch (error) {
      console.error("Failed to get key", key);
      return this._createFailureResult(
        key,
        CacheOperationError.get(key, error),
      );
    }
  }

  getMany<T>(args: { keys: Array<string> }): Array<CacheResult<T>> {
    const parsedKeys = this._validateSchema({
      schema: cacheKeysSchema,
      data: args.keys,
    });

    return parsedKeys.map((item) => {
      const key = this._generateCacheKey({ id: item });

      try {
        const result = this._cache.get<T>(key);

        return result
          ? this._createSuccessResult(result)
          : this._createFailureResult(key, CacheOperationError.get(key));
      } catch (error) {
        return this._createFailureResult(
          key,
          CacheOperationError.get(key, error),
        );
      }
    });
  }

  delete(args: { key: string }): boolean {
    const parsedKey = this._validateSchema({
      schema: cacheKeySchema,
      data: args.key,
    });

    const key = this._generateCacheKey({ id: parsedKey });

    try {
      const isDeleted = this._cache.del(key);
      return isDeleted === 0 ? false : true;
    } catch (error) {
      console.error("Failed to delete key", key);
      return false;
    }
  }

  deleteMany(args: { keys: Array<string> }): Array<boolean> {
    const parsedKeys = this._validateSchema({
      schema: cacheKeysSchema,
      data: args.keys,
    });

    const cacheKeys = parsedKeys.map((key) =>
      this._generateCacheKey({ id: key }),
    );

    return cacheKeys.map((key) => {
      try {
        const isDeleted = this._cache.del(key);
        return isDeleted === 0 ? false : true;
      } catch (error) {
        console.error("Failed to delete key", key);
        return false;
      }
    });
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

  private _createSuccessResult<T>(data: T): CacheSuccessResult<T> {
    return {
      success: true,
      data,
    };
  }

  private _createFailureResult<T, E = Error>(
    key: T,
    error: E,
  ): CacheFailureResult<T, E> {
    return {
      key,
      success: false,
      error,
    };
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
