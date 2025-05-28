import { ICacheManager } from "../../managers";
import { FunctionMocksWithReset } from "../types/mocked.type";
import { mockGenerateCacheKey } from "./cache-generate-key.mock";

export function mockCacheHit<T>({
  instance,
  cacheKey,
  returnValue,
}: {
  instance: FunctionMocksWithReset<ICacheManager>;
  cacheKey: string;
  returnValue: T;
}): void {
  mockGenerateCacheKey({ instance, key: cacheKey });

  instance.get.mock.mockImplementationOnce(() => returnValue);
}
