import NodeCache from "node-cache";
import { DEFAULT_CACHE_CONFIG, MAX_CACHE_SIZE } from "../config";
import { DatabaseError } from "../errors";
import { CacheConfig, CacheStats, Namespace } from "../types";

interface IPublicCacheManager {
  flush(): void;
}
export interface ICacheManager extends IPublicCacheManager {
  set({
    key,
    value,
    ttl,
  }: {
    key: string;
    value: unknown;
    ttl?: number;
  }): boolean;
  get<T>({ key }: { key: string }): T | undefined;
  delete({ keys }: { keys: string | string[] }): number;
  getStats(): CacheStats;
  generateCacheKey({ id }: { id: string }): string;
}

export class CacheManager implements ICacheManager {
  private static instances: Partial<Record<Namespace, CacheManager>> = {};
  private cache: NodeCache;
  private readonly namespace: Namespace;

  constructor(namespace: Namespace, config?: Partial<CacheConfig>) {
    this.namespace = namespace;
    this.cache = new NodeCache({
      ...DEFAULT_CACHE_CONFIG,
      ...config,
    });

    CacheManager.instances[namespace] = this;

    // Error handling
    // type can be: "error" | "expired" | "del" | "set" | "get" | "flush"
    // this.cache.on(type, (error) => {});
  }

  public static getInstance(
    namespace: Namespace,
    config?: Partial<CacheConfig>,
  ): IPublicCacheManager {
    if (!this.instances[namespace]) {
      this.instances[namespace] = new CacheManager(namespace, config);
    }
    // Now we're sure it exists
    return {
      flush: this.instances[namespace]!.flush.bind(this.instances[namespace]),
    };
  }

  set({
    key,
    value,
    ttl,
  }: {
    key: string;
    value: unknown;
    ttl?: number;
  }): boolean {
    const isCacheFull = this.cache.keys().length >= MAX_CACHE_SIZE;
    if (isCacheFull) {
      return this.deleteLeastUsedKeys({ key, value, ttl });
    }

    const namespaceKey = this.generateCacheKey({ id: key });
    try {
      const isSuccess = this.cache.set(namespaceKey, value, ttl!);
      if (isSuccess) console.log("cache set", key);

      return isSuccess;
    } catch (error) {
      console.error(error);
      throw new DatabaseError();
    }
  }

  get<T>({ key }: { key: string }): T | undefined {
    const namespaceKey = this.generateCacheKey({ id: key });

    try {
      const value = this.cache.get<T>(namespaceKey);
      if (value) console.log("Cache hit:", key);
      else console.log("Cache miss:", key);

      return value;
    } catch (error) {
      console.error(error);
      throw new DatabaseError();
    }
  }

  delete({ keys }: { keys: string | string[] }): number {
    const namespaceKey = Array.isArray(keys)
      ? keys.map((key) => this.generateCacheKey({ id: key }))
      : this.generateCacheKey({ id: keys });

    try {
      const isDeleted = this.cache.del(namespaceKey);
      console.log("Cache delete", keys);
      return isDeleted;
    } catch (error) {
      console.error(error);
      throw new DatabaseError();
    }
  }

  flush(): void {
    try {
      this.cache.flushAll();
      console.log("Cache flushed");
    } catch (error) {
      console.error(error);
      throw new DatabaseError();
    }
  }

  getStats(): CacheStats {
    const stats = this.cache.getStats();
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
    return `${this.namespace}:${id}`;
  }

  private deleteLeastUsedKeys<T>({
    key,
    value,
    ttl,
  }: {
    key: string;
    value: T;
    ttl?: number;
  }): boolean {
    console.log("Cache is full, deleting least used keys");

    const lruKeys = this.cache
      .keys()
      .sort((a, b) => {
        const aHit = this.cache.getTtl(a) || 0;
        const bHit = this.cache.getTtl(b) || 0;
        return aHit - bHit;
      })
      .slice(0, Math.ceil(MAX_CACHE_SIZE * 0.1)); // remove 10% of the cached items (least recently used)

    this.cache.del(lruKeys);

    return this.set({ key, value, ttl });
  }
}
