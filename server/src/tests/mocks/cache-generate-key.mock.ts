import { ICacheManager } from "../../managers";
import { FunctionMocksWithReset } from "../types/mocked.type";

export function mockGenerateCacheKey({
  instance,
  key,
}: {
  instance: FunctionMocksWithReset<ICacheManager>;
  key: string;
}): void {
  instance.generateKey.mock.mockImplementationOnce(() => key);
}
