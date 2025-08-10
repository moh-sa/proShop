import { mock } from "node:test";

import type { IImageStorageManager } from "../../managers/index.js";
import type { FunctionMocksWithReset } from "../types/mocked.type.js";

export function mockImageStorage(): FunctionMocksWithReset<IImageStorageManager> {
	return {
		delete: mock.fn(),
		replace: mock.fn(),
		reset() {
			this.upload.mock.resetCalls();
			this.replace.mock.resetCalls();
			this.delete.mock.resetCalls();

			this.upload.mock.restore();
			this.replace.mock.restore();
			this.delete.mock.restore();
		},
		upload: mock.fn(),
	};
}
