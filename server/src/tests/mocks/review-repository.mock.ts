import { mock } from "node:test";
import { IReviewRepository } from "../../repositories";
import { FunctionMocksWithReset } from "../types/mocked.type";

export function mockReviewRepository(): FunctionMocksWithReset<IReviewRepository> {
  return {
    create: mock.fn(),
    getAll: mock.fn(),
    getAllByUserId: mock.fn(),
    getById: mock.fn(),
    getAllByProductId: mock.fn(),
    update: mock.fn(),
    delete: mock.fn(),
    count: mock.fn(),
    countByUserId: mock.fn(),
    countByProductId: mock.fn(),
    existsById: mock.fn(),
    existsByUserIdAndProductId: mock.fn(),
    reset: function () {
      this.create.mock.resetCalls();
      this.getAll.mock.resetCalls();
      this.getAllByUserId.mock.resetCalls();
      this.getById.mock.resetCalls();
      this.getAllByProductId.mock.resetCalls();
      this.update.mock.resetCalls();
      this.delete.mock.resetCalls();
      this.count.mock.resetCalls();
      this.countByUserId.mock.resetCalls();
      this.countByProductId.mock.resetCalls();
      this.existsById.mock.resetCalls();
      this.existsByUserIdAndProductId.mock.resetCalls();

      this.create.mock.restore();
      this.getAll.mock.restore();
      this.getAllByUserId.mock.restore();
      this.getById.mock.restore();
      this.getAllByProductId.mock.restore();
      this.update.mock.restore();
      this.delete.mock.restore();
      this.count.mock.restore();
      this.countByUserId.mock.restore();
      this.countByProductId.mock.restore();
      this.existsById.mock.restore();
      this.existsByUserIdAndProductId.mock.restore();
    },
  };
}
