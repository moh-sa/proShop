import { CacheOperationError } from "../../errors";
import { ICacheManager } from "../../managers";
import { FunctionMocksWithReset } from "../types/mocked.type";

export function mockCacheInvalidation({
  instance,
  cacheKey,
}: {
  instance: FunctionMocksWithReset<ICacheManager>;
  cacheKey: string;
}): void {
  instance.delete.mock.mockImplementationOnce(() => ({
    success: false,
    key: cacheKey,
    error: CacheOperationError.delete(cacheKey),
  }));

  instance.getStats.mock.mockImplementationOnce(() => ({
    hits: 0,
    misses: 0,
    numberOfKeys: 0,
    keysSize: 0,
    valuesSize: 0,
    totalSize: 0,
  }));
}
