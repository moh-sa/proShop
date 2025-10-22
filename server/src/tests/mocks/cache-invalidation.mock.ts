import type { ICacheService } from "../../services/index.js";
import type { FunctionMocksWithReset } from "../types/mocked.type.js";

export function mockCacheInvalidation({
	cacheKey,
	instance,
}: {
	cacheKey: string;
	instance: FunctionMocksWithReset<ICacheService>;
}): void {
	instance.delete.mock.mockImplementation(() => ({
		data: cacheKey,
		success: true,
	}));
}
