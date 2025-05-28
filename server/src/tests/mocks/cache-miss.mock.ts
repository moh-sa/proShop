import { ICacheManager } from "../../managers";
import { FunctionMocksWithReset } from "../types/mocked.type";
import { mockGenerateCacheKey } from "./cache-generate-key.mock";

export function mockCacheMiss({
  instance,
  cacheKey,
}: {
  instance: FunctionMocksWithReset<ICacheManager>;
  cacheKey: string;
}): void {
  mockGenerateCacheKey({ instance, key: cacheKey });

  instance.get.mock.mockImplementationOnce(() => undefined);
}
