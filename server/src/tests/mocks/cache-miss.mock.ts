import type { ICacheService } from "../../services/index.js";
import type { FunctionMocksWithReset } from "../types/mocked.type.js";

export function mockCacheMiss({
	instance,
}: {
	instance: FunctionMocksWithReset<ICacheService>;
}): void {
	instance.get.mock.mockImplementationOnce(() => ({
		data: undefined,
		success: true,
	}));
}
