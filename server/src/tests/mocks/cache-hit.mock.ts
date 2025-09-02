import type { ICacheService } from "../../services/index.js";
import type { FunctionMocksWithReset } from "../types/mocked.type.js";

export function mockCacheHit<T>({
	cacheKey, // eslint-disable-line @typescript-eslint/no-unused-vars
	instance,
	returnValue,
}: {
	cacheKey: string;
	instance: FunctionMocksWithReset<ICacheService>;
	returnValue: T;
}): void {
	instance.get.mock.mockImplementationOnce(() => ({
		data: returnValue,
		success: true,
	}));
}
