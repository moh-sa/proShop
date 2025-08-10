import type { ICacheManager } from "../../managers/index.js";
import type { FunctionMocksWithReset } from "../types/mocked.type.js";

import { CacheOperationError } from "../../errors/index.js";

export function mockCacheMiss({
	cacheKey,
	instance,
}: {
	cacheKey: string;
	instance: FunctionMocksWithReset<ICacheManager>;
}): void {
	instance.get.mock.mockImplementationOnce(() => ({
		error: CacheOperationError.get(cacheKey),
		key: cacheKey,
		success: false,
	}));
}
