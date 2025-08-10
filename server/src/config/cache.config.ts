import type { CacheConfig } from "../types/index.js";

export const MAX_CACHE_SIZE = 1000;

export const DEFAULT_CACHE_CONFIG = {
  checkperiod: 24 * 60 * 60, // every 1 day
  deleteOnExpire: true,
  maxKeys: MAX_CACHE_SIZE,
  stdTTL: 30 * 24 * 60 * 60, // 30 days
  useClones: false,
} as const satisfies CacheConfig;
