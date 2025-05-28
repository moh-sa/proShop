import { mock } from "node:test";
import { IImageStorageManager } from "../../managers";
import { FunctionMocksWithReset } from "../types/mocked.type";

export function mockImageStorage(): FunctionMocksWithReset<IImageStorageManager> {
  return {
    upload: mock.fn(),
    replace: mock.fn(),
    delete: mock.fn(),
    reset: function () {
      this.upload.mock.resetCalls();
      this.replace.mock.resetCalls();
      this.delete.mock.resetCalls();

      this.upload.mock.restore();
      this.replace.mock.restore();
      this.delete.mock.restore();
    },
  };
}
