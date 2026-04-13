 

import { mock } from "node:test";

import type { IUserService } from "../../services/index.js";
import type { FunctionMocksWithReset } from "../types/mocked.type.js";

export function mockUserService(): FunctionMocksWithReset<IUserService> {
	return {
		create: mock.fn(),
		delete: mock.fn(),
		updateById: mock.fn(),
		getAll: mock.fn(),
		getByEmail: mock.fn(),
		getById: mock.fn(),
		existsByEmail: mock.fn(),
		create_UNSAFE: mock.fn(),
		getByEmail_UNSAFE: mock.fn(),
		getById_UNSAFE: mock.fn(),
		sanitizeUser: mock.fn(),

		reset() {
			this.create.mock.resetCalls();
			this.getAll.mock.resetCalls();
			this.getById.mock.resetCalls();
			this.getByEmail.mock.resetCalls();
			this.updateById.mock.resetCalls();
			this.delete.mock.resetCalls();
			this.existsByEmail.mock.resetCalls();
			this.create_UNSAFE.mock.resetCalls();
			this.getByEmail_UNSAFE.mock.resetCalls();
			this.getById_UNSAFE.mock.resetCalls();
			this.sanitizeUser.mock.resetCalls();

			this.create.mock.restore();
			this.getAll.mock.restore();
			this.getById.mock.restore();
			this.getByEmail.mock.restore();
			this.updateById.mock.restore();
			this.delete.mock.restore();
			this.existsByEmail.mock.restore();
			this.create_UNSAFE.mock.restore();
			this.getByEmail_UNSAFE.mock.restore();
			this.getById_UNSAFE.mock.restore();
			this.sanitizeUser.mock.restore();
		},
	};
}
