import { ICacheManager } from "../../managers";
import { FunctionMocksWithReset } from "../types/mocked.type";

export function mockSetCache({
  instance,
  cacheKey,
}: {
  instance: FunctionMocksWithReset<ICacheManager>;
  cacheKey: string;
}): void {
  instance.set.mock.mockImplementationOnce(() => ({
    success: true,
    data: cacheKey,
  }));
}
