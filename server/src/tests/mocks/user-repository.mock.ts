import { mock } from "node:test";
import { IUserRepository } from "../../repositories";
import { FunctionMocksWithReset } from "../types/mocked.type";

export function mockUserRepository(): FunctionMocksWithReset<IUserRepository> {
  return {
    create: mock.fn(),
    getAll: mock.fn(),
    getById: mock.fn(),
    getByEmail: mock.fn(),
    update: mock.fn(),
    delete: mock.fn(),
    existsByEmail: mock.fn(),
    reset: function () {
      this.create.mock.resetCalls();
      this.getAll.mock.resetCalls();
      this.getById.mock.resetCalls();
      this.getByEmail.mock.resetCalls();
      this.update.mock.resetCalls();
      this.delete.mock.resetCalls();
      this.existsByEmail.mock.resetCalls();

      this.create.mock.restore();
      this.getAll.mock.restore();
      this.getById.mock.restore();
      this.getByEmail.mock.restore();
      this.update.mock.restore();
      this.delete.mock.restore();
      this.existsByEmail.mock.restore();
    },
  };
}
