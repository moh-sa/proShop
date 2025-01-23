import NodeCache from "node-cache";
import { DatabaseError } from "../errors";

const MAX_CACHE_SIZE = 1000;

type Namespace = "product" | "user" | "order";

interface CacheConfig {
  stdTTL: number;
  checkperiod: number;
  useClones: boolean;
  deleteOnExpire: boolean;
}

interface ICache {
  get<T>({ key }: { key: string }): T | undefined;
  set<T>({ key, value, ttl }: { key: string; value: T; ttl?: number }): boolean;
  delete({ keys }: { keys: string | string[] }): number;
  flush(): void;
  stats(): {
    hits: number;
    misses: number;
    keys: number;
    ksize: number;
    vsize: number;
  };
}

export class CacheManager implements ICache {
  private cache: NodeCache;
  private readonly namespace: Namespace;

  constructor(namespace: Namespace, config?: Partial<CacheConfig>) {
    this.namespace = namespace;
    this.cache = new NodeCache({
      stdTTL: 0, // no expiration since the data rarely changes.
      checkperiod: 7 * 24 * 60 * 60, // check for expired keys every 1 week
      useClones: false,
      deleteOnExpire: true,
      ...config,
    });

    // Error handling
    // type can be: "error" | "expired" | "del" | "set" | "get" | "flush"
    // this.cache.on(type, (error) => {});
  }

  get<T>({ key }: { key: string }): T | undefined {
    const namespaceKey = this.getNamespaceKey(key);

    try {
      const value = this.cache.get<T>(namespaceKey);
      if (value) console.log("Cache hit:", key);

      return value;
    } catch (error) {
      console.error(error);
      throw new DatabaseError();
    }
  }

  set<T>({
    key,
    value,
    ttl,
  }: {
    key: string;
    value: T;
    ttl?: number;
  }): boolean {
    const isCacheFull = this.cache.keys().length >= MAX_CACHE_SIZE;
    if (isCacheFull) {
      return this.deleteLeastUsedKeys({ key, value, ttl });
    }

    const namespaceKey = this.getNamespaceKey(key);
    try {
      const isSuccess = this.cache.set(namespaceKey, value, ttl!);
      if (isSuccess) console.log("cache set", key);

      return isSuccess;
    } catch (error) {
      console.error(error);
      throw new DatabaseError();
    }
  }

  delete({ keys }: { keys: string | string[] }): number {
    const namespaceKey = Array.isArray(keys)
      ? keys.map((key) => this.getNamespaceKey(key))
      : this.getNamespaceKey(keys);

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

  stats(): {
    hits: number;
    misses: number;
    keys: number;
    ksize: number;
    vsize: number;
  } {
    return this.cache.getStats();
  }

  generateKey({ id }: { id: string }) {
    return `${this.namespace}:${id}`;
  }

  private getNamespaceKey(key: string): string {
    return `${this.namespace}:${key}`;
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
