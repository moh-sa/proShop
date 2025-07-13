import NodeCache from "node-cache";
import { DEFAULT_CACHE_CONFIG, MAX_CACHE_SIZE } from "../config";
import { DatabaseError } from "../errors";
import { CacheConfig, CacheStats, Namespace } from "../types";

interface IPublicCacheManager {
  flush(): void;
}
export interface ICacheManager extends IPublicCacheManager {
  set(args: { key: string; value: unknown; ttl?: number }): boolean;
  get<T>(args: { key: string }): T | undefined;
  delete(args: { keys: string | string[] }): number;
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

  set(args: { key: string; value: unknown; ttl?: number }): boolean {
    const isCacheFull = this._cache.keys().length >= MAX_CACHE_SIZE;
    if (isCacheFull) {
      return this._deleteLeastUsedKeys(args);
    }

    const namespaceKey = this.generateCacheKey({ id: args.key });
    try {
      const isSuccess = this._cache.set(namespaceKey, args.value, args.ttl!);
      if (isSuccess) console.log("cache set", args.key);

      return isSuccess;
    } catch (error) {
      console.error(error);
      throw new DatabaseError();
    }
  }

  get<T>(args: { key: string }): T | undefined {
    const namespaceKey = this.generateCacheKey({ id: args.key });

    try {
      const value = this._cache.get<T>(namespaceKey);
      if (value) console.log("Cache hit:", args.key);
      else console.log("Cache miss:", args.key);

      return value;
    } catch (error) {
      console.error(error);
      throw new DatabaseError();
    }
  }

  delete(args: { keys: string | string[] }): number {
    const namespaceKey = Array.isArray(args.keys)
      ? args.keys.map((key) => this.generateCacheKey({ id: key }))
      : this.generateCacheKey({ id: args.keys });

    try {
      const isDeleted = this._cache.del(namespaceKey);
      console.log("Cache delete", args.keys);
      return isDeleted;
    } catch (error) {
      console.error(error);
      throw new DatabaseError();
    }
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

  private _deleteLeastUsedKeys<T>({
    key,
    value,
    ttl,
  }: {
    key: string;
    value: T;
    ttl?: number;
  }): boolean {
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

    return this.set({ key, value, ttl });
  }
}
