import { ICacheManager } from "../../managers";
import { FunctionMocksWithReset } from "../types/mocked.type";
import { mockGenerateCacheKey } from "./cache-generate-key.mock";

export function mockCacheInvalidation({
  instance,
  cacheKey,
}: {
  instance: FunctionMocksWithReset<ICacheManager>;
  cacheKey: string;
}): void {
  mockGenerateCacheKey({ instance, key: cacheKey });

  instance.delete.mock.mockImplementationOnce(() => 1);

  instance.stats.mock.mockImplementationOnce(() => ({
    hits: 0,
    misses: 0,
    keys: 0,
    ksize: 0,
    vsize: 0,
  }));
}
