import type { ICacheManager } from "../../managers/index.js";
import type { FunctionMocksWithReset } from "../types/mocked.type.js";

import { CacheOperationError } from "../../errors/index.js";

export function mockCacheInvalidation({
  cacheKey,
  instance,
}: {
  cacheKey: string;
  instance: FunctionMocksWithReset<ICacheManager>;
}): void {
  instance.delete.mock.mockImplementationOnce(() => ({
    error: CacheOperationError.delete(cacheKey),
    key: cacheKey,
    success: false,
  }));

  instance.getStats.mock.mockImplementationOnce(() => ({
    hits: 0,
    keysSize: 0,
    misses: 0,
    numberOfKeys: 0,
    totalSize: 0,
    valuesSize: 0,
  }));
}
