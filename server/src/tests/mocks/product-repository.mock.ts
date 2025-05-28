import { mock } from "node:test";
import { IProductRepository } from "../../repositories";
import { FunctionMocksWithReset } from "../types/mocked.type";

export function mockProductRepository(): FunctionMocksWithReset<IProductRepository> {
  return {
    create: mock.fn(),
    getAll: mock.fn(),
    getTopRated: mock.fn(),
    getById: mock.fn(),
    update: mock.fn(),
    delete: mock.fn(),
    count: mock.fn(),
    reset: function () {
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
  };
}
