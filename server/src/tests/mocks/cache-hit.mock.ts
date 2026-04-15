import type { ICacheService } from "../../services/index.js";
import type { FunctionMocksWithReset } from "../types/mocked.type.js";

export function mockCacheHit<T>({
	instance,
	returnValue,
}: {
	instance: FunctionMocksWithReset<ICacheService>;
	returnValue: T;
}): void {
	instance.get.mock.mockImplementationOnce(() => ({
		data: returnValue,
		success: true,
	}));
}
