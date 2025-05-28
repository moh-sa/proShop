import { mock } from "node:test";
import { IUserService } from "../../services";
import { FunctionMocksWithReset } from "../types/mocked.type";

export function mockUserService(): FunctionMocksWithReset<IUserService> {
  return {
    getAll: mock.fn(),
    getById: mock.fn(),
    getByEmail: mock.fn(),
    updateById: mock.fn(),
    delete: mock.fn(),
    reset: function () {
      this.getAll.mock.resetCalls();
      this.getById.mock.resetCalls();
      this.getByEmail.mock.resetCalls();
      this.updateById.mock.resetCalls();
      this.delete.mock.resetCalls();

      this.getAll.mock.restore();
      this.getById.mock.restore();
      this.getByEmail.mock.restore();
      this.updateById.mock.restore();
      this.delete.mock.restore();
    },
  };
}
