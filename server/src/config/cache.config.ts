import { CacheConfig } from "../types";

export const MAX_CACHE_SIZE = 1000;

export const DEFAULT_CACHE_CONFIG = {
  stdTTL: 30 * 24 * 60 * 60, // 30 days
  checkperiod: 24 * 60 * 60, // every 1 day
  useClones: false,
  deleteOnExpire: true,
  maxKeys: MAX_CACHE_SIZE,
} as const satisfies CacheConfig;
