import { mock } from "node:test";

import type { IProductRepository } from "../../repositories/index.js";
import type { FunctionMocksWithReset } from "../types/mocked.type.js";

export function mockProductRepository(): FunctionMocksWithReset<IProductRepository> {
  return {
    count: mock.fn(),
    create: mock.fn(),
    delete: mock.fn(),
    getAll: mock.fn(),
    getById: mock.fn(),
    getTopRated: mock.fn(),
    reset() {
      this.create.mock.resetCalls();
      this.getAll.mock.resetCalls();
      this.getTopRated.mock.resetCalls();
      this.getById.mock.resetCalls();
      this.update.mock.resetCalls();
      this.delete.mock.resetCalls();
      this.count.mock.resetCalls();

      this.create.mock.restore();
      this.getAll.mock.restore();
      this.getTopRated.mock.restore();
      this.getById.mock.restore();
      this.update.mock.restore();
      this.delete.mock.restore();
      this.count.mock.restore();
    },
    update: mock.fn(),
  };
}
