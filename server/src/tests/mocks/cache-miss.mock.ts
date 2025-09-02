import type { ICacheService } from "../../services/index.js";
import type { FunctionMocksWithReset } from "../types/mocked.type.js";

import { CacheOperationError } from "../../errors/index.js";

export function mockCacheMiss({
	cacheKey,
	instance,
}: {
	cacheKey: string;
	instance: FunctionMocksWithReset<ICacheService>;
}): void {
	instance.get.mock.mockImplementationOnce(() => ({
		error: CacheOperationError.get(cacheKey),
		key: cacheKey,
		success: false,
	}));
}
