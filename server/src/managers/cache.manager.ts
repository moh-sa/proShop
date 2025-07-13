import NodeCache from "node-cache";
import { z } from "zod";
import { DEFAULT_CACHE_CONFIG, MAX_CACHE_SIZE } from "../config";
import { DatabaseError, ValidationError } from "../errors";
import { cacheKeySchema, cacheKeysSchema, cacheSetSchema } from "../schemas";
import { CacheConfig, CacheStats, Namespace } from "../types";
import { formatZodErrors } from "../utils";

interface IPublicCacheManager {
  flush(): void;
}
export interface ICacheManager extends IPublicCacheManager {
  set(args: { key: string; value: {}; ttl?: number }): boolean;
  get<T>(args: { key: string }): T | undefined;
  getMany<T>(args: { keys: Array<string> }): Record<string, T | undefined>;
  delete(args: { key: string }): true;
  deleteMany(args: { keys: Array<string> }): true;
  getStats(): CacheStats;
  generateCacheKey({ id }: { id: string }): string;
}

export class CacheManager implements ICacheManager {
  private static _instances: Partial<Record<Namespace, CacheManager>> = {};
  private _cache: NodeCache;
  private readonly _namespace: Namespace;

  constructor(namespace: Namespace, config?: Partial<CacheConfig>) {
    this._namespace = namespace;
    this._cache = new NodeCache({
      ...DEFAULT_CACHE_CONFIG,
      ...config,
    });

    CacheManager._instances[namespace] = this;

    // Error handling
    // type can be: "error" | "expired" | "del" | "set" | "get" | "flush"
    // this.cache.on(type, (error) => {});
  }

  public static getInstance(
    namespace: Namespace,
    config?: Partial<CacheConfig>,
  ): IPublicCacheManager {
    if (!this._instances[namespace]) {
      this._instances[namespace] = new CacheManager(namespace, config);
    }
    // Now we're sure it exists
    return {
      flush: this._instances[namespace]!.flush.bind(this._instances[namespace]),
    };
  }

  set(args: { key: string; value: {}; ttl?: number }): true {
    this._validateMemoryCapacity();

    const parsedArgs = this._validateSchema({
      schema: cacheSetSchema,
      data: {
        key: args.key,
        val: args.value,
        ttl: args.ttl ?? DEFAULT_CACHE_CONFIG.stdTTL,
      },
    });
    const key = this.generateCacheKey({ id: parsedArgs.key });

    const isKeyCached = this._cache.has(key);
    if (isKeyCached) {
      console.error("Key already cached", key);
      throw new Error("Key already cached");
    }

    const isSet = this._cache.set(key, parsedArgs.val, parsedArgs.ttl);
    if (!isSet) {
      console.error("Failed to set key", key);
      throw new Error("Failed to set key");
    }

    return isSet;
  }

  get<T>(args: { key: string }): T | undefined {
    const parsedKey = this._validateSchema({
      schema: cacheKeySchema,
      data: args.key,
    });
    const key = this.generateCacheKey({ id: parsedKey });

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

    const keys = parsedKeys.map((key) => this.generateCacheKey({ id: key }));
    const values = this._cache.mget<T>(keys);

    return values;
  }

  delete(args: { key: string }): true {
    const parsedKey = this._validateSchema({
      schema: cacheKeySchema,
      data: args.key,
    });
    const key = this.generateCacheKey({ id: parsedKey });

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
      this.generateCacheKey({ id: key }),
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

  generateCacheKey({ id }: { id: string }): string {
    return `${this._namespace}:${id}`;
  }

  private _validateMemoryCapacity(): void {
    const isMemoryFull = this._cache.keys().length >= MAX_CACHE_SIZE;
    if (isMemoryFull) this._deleteLeastUsedKeys();
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

  private _deleteLeastUsedKeys(): void {
    console.log("Cache is full, deleting least used keys");

    const lruKeys = this._cache
      .keys()
      .sort((a, b) => {
        const aHit = this._cache.getTtl(a) || 0;
        const bHit = this._cache.getTtl(b) || 0;
        return aHit - bHit;
      })
      .slice(0, Math.ceil(MAX_CACHE_SIZE * 0.1)); // remove 10% of the cached items (least recently used)

    this._cache.del(lruKeys);
  }
}
