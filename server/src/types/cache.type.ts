import NodeCache from "node-cache";

export type Namespace = "product" | "user" | "order" | "rate-limit";

export type CacheConfig = NodeCache.Options;

export type CacheStats = {
  hits: number;
  misses: number;
  keys: number;
  ksize: number;
  vsize: number;
};
