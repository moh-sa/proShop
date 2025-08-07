import NodeCache from "node-cache";
import { mock } from "node:test";
import { FunctionMocksWithReset } from "../types/mocked.type";

// for some weird reason, NodeCache has TWO different types for getTtl
// and I couldn't find a way to pick the one that been used in the manager
type GetTtl = { getTtl: (key: string) => number | undefined };
export function mockNodeCache(): FunctionMocksWithReset<
  Pick<
    NodeCache,
    | "set"
    | "mset"
    | "get"
    | "mget"
    | "del"
    | "keys"
    | "has"
    | "take"
    | "getStats"
    | "flushStats"
    | "flushAll"
  > &
    GetTtl
> {
  return {
    set: mock.fn(),
    mset: mock.fn(),
    get: mock.fn(),
    mget: mock.fn(),
    del: mock.fn(),
    keys: mock.fn(),
    has: mock.fn(),
    getTtl: mock.fn(),
    take: mock.fn(),
    getStats: mock.fn(),
    flushStats: mock.fn(),
    flushAll: mock.fn(),
    reset: function () {
      this.set.mock.resetCalls();
      this.mset.mock.resetCalls();
      this.get.mock.resetCalls();
      this.mget.mock.resetCalls();
      this.del.mock.resetCalls();
      this.keys.mock.resetCalls();
      this.has.mock.resetCalls();
      this.getTtl.mock.resetCalls();
      this.take.mock.resetCalls();
      this.getStats.mock.resetCalls();
      this.flushStats.mock.resetCalls();
      this.flushAll.mock.resetCalls();

      this.set.mock.restore();
      this.mset.mock.restore();
      this.get.mock.restore();
      this.mget.mock.restore();
      this.del.mock.restore();
      this.keys.mock.restore();
      this.has.mock.restore();
      this.getTtl.mock.restore();
      this.take.mock.restore();
      this.getStats.mock.restore();
      this.flushStats.mock.restore();
      this.flushAll.mock.restore();
    },
  };
}
