import { ICacheManager } from "../../managers";
import { FunctionMocksWithReset } from "../types/mocked.type";

export function mockCacheHit<T>({
  instance,
  cacheKey,
  returnValue,
}: {
  instance: FunctionMocksWithReset<ICacheManager>;
  cacheKey: string;
  returnValue: T;
}): void {
  instance.get.mock.mockImplementationOnce(() => ({
    success: true,
    data: returnValue,
  }));
}
