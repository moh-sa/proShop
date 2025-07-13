import { mock } from "node:test";
import { ICacheManager } from "../../managers";
import { FunctionMocksWithReset } from "../types/mocked.type";

export function mockCacheManager(): FunctionMocksWithReset<ICacheManager> {
  return {
    set: mock.fn(),
    setMany: mock.fn(),
    get: mock.fn(),
    getMany: mock.fn(),
    delete: mock.fn(),
    take: mock.fn(),
    flush: mock.fn(),
    flushStats: mock.fn(),
    getStats: mock.fn(),
    getKeys: mock.fn(),
    generateCacheKey: mock.fn(),
    deleteMany: mock.fn(),
    reset: function () {
      this.set.mock.resetCalls();
      this.setMany.mock.resetCalls();
      this.get.mock.resetCalls();
      this.getMany.mock.resetCalls();
      this.delete.mock.resetCalls();
      this.take.mock.resetCalls();
      this.flush.mock.resetCalls();
      this.flushStats.mock.resetCalls();
      this.getStats.mock.resetCalls();
      this.getKeys.mock.resetCalls();
      this.generateCacheKey.mock.resetCalls();
      this.deleteMany.mock.resetCalls();

      this.set.mock.restore();
      this.setMany.mock.restore();
      this.get.mock.restore();
      this.getMany.mock.restore();
      this.delete.mock.restore();
      this.take.mock.restore();
      this.flush.mock.restore();
      this.flushStats.mock.restore();
      this.getStats.mock.restore();
      this.getKeys.mock.restore();
      this.generateCacheKey.mock.restore();
      this.deleteMany.mock.restore();
    },
  };
}
