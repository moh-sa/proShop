import { mock } from "node:test";
import { ICacheManager } from "../../managers";
import { FunctionMocksWithReset } from "../types/mocked.type";

export function mockCacheManager(): FunctionMocksWithReset<ICacheManager> {
  return {
    set: mock.fn(),
    get: mock.fn(),
    delete: mock.fn(),
    flush: mock.fn(),
    getStats: mock.fn(),
    generateCacheKey: mock.fn(),
    reset: function () {
      this.set.mock.resetCalls();
      this.get.mock.resetCalls();
      this.delete.mock.resetCalls();
      this.flush.mock.resetCalls();
      this.getStats.mock.resetCalls();
      this.generateCacheKey.mock.resetCalls();

      this.set.mock.restore();
      this.get.mock.restore();
      this.delete.mock.restore();
      this.flush.mock.restore();
      this.getStats.mock.restore();
      this.generateCacheKey.mock.restore();
    },
  };
}
