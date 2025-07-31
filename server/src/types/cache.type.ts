import NodeCache from "node-cache";

export type Namespace = "product" | "user" | "order" | "rate-limit";

export type CacheConfig = NodeCache.Options;

export type CacheStats = {
  hits: number;
  misses: number;
  numberOfKeys: number;
  keysSize: number;
  valuesSize: number;
  totalSize: number;
};

export type CacheItem = { key: string; value: {}; ttl?: number };
export type CacheItems = Array<CacheItem>;
