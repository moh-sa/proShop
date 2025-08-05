import { CacheOperationError } from "../../errors";
import { ICacheManager } from "../../managers";
import { FunctionMocksWithReset } from "../types/mocked.type";

export function mockCacheMiss({
  instance,
  cacheKey,
}: {
  instance: FunctionMocksWithReset<ICacheManager>;
  cacheKey: string;
}): void {
  instance.get.mock.mockImplementationOnce(() => ({
    success: false,
    key: cacheKey,
    error: CacheOperationError.get(cacheKey),
  }));
}
