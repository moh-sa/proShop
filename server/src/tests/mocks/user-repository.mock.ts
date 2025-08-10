import { mock } from "node:test";

import type { IUserRepository } from "../../repositories/index.js";
import type { FunctionMocksWithReset } from "../types/mocked.type.js";

export function mockUserRepository(): FunctionMocksWithReset<IUserRepository> {
	return {
		create: mock.fn(),
		delete: mock.fn(),
		existsByEmail: mock.fn(),
		getAll: mock.fn(),
		getByEmail: mock.fn(),
		getById: mock.fn(),
		reset() {
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
		update: mock.fn(),
	};
}
