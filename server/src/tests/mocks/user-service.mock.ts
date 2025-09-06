import { mock } from "node:test";

import type { IUserService } from "../../services/index.js";
import type { FunctionMocksWithReset } from "../types/mocked.type.js";

export function mockUserService(): FunctionMocksWithReset<IUserService> {
	return {
		create: mock.fn(),
		delete: mock.fn(),
		getAll: mock.fn(),
		getByEmail: mock.fn(),
		getById: mock.fn(),
		reset() {
			this.create.mock.resetCalls();
			this.getAll.mock.resetCalls();
			this.getById.mock.resetCalls();
			this.getByEmail.mock.resetCalls();
			this.updateById.mock.resetCalls();
			this.delete.mock.resetCalls();

			this.create.mock.restore();
			this.getAll.mock.restore();
			this.getById.mock.restore();
			this.getByEmail.mock.restore();
			this.updateById.mock.restore();
			this.delete.mock.restore();
		},
		updateById: mock.fn(),
	};
}
