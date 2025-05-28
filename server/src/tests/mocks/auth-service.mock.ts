import { mock } from "node:test";
import { IAuthService } from "../../services";
import { FunctionMocksWithReset } from "../types/mocked.type";

export function mockAuthService(): FunctionMocksWithReset<IAuthService> {
  return {
    signup: mock.fn(),
    signin: mock.fn(),
    reset: function () {
      this.signup.mock.resetCalls();
      this.signin.mock.resetCalls();

      this.signup.mock.restore();
      this.signin.mock.restore();
    },
  };
}
