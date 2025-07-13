import NodeCache from "node-cache";

export type Namespace = "product" | "user" | "order" | "rate-limit";

export type CacheConfig = NodeCache.Options;
