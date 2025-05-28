import { mock } from "node:test";
import { IOrderService } from "../../services";
import { FunctionMocksWithReset } from "../types/mocked.type";

export function mockOrderService(): FunctionMocksWithReset<IOrderService> {
  return {
    create: mock.fn(),
    getAll: mock.fn(),
    getById: mock.fn(),
    getAllByUserId: mock.fn(),
    updateToDelivered: mock.fn(),
    updateToPaid: mock.fn(),
    reset: function () {
      this.create.mock.resetCalls();
      this.getAll.mock.resetCalls();
      this.getById.mock.resetCalls();
      this.getAllByUserId.mock.resetCalls();
      this.updateToDelivered.mock.resetCalls();
      this.updateToPaid.mock.resetCalls();

      this.create.mock.restore();
      this.getAll.mock.restore();
      this.getById.mock.restore();
      this.getAllByUserId.mock.restore();
      this.updateToDelivered.mock.restore();
      this.updateToPaid.mock.restore();
    },
  };
}
