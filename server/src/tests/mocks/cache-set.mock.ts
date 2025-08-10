import type { ICacheManager } from "../../managers/index.js";
import type { FunctionMocksWithReset } from "../types/mocked.type.js";

export function mockSetCache({
	cacheKey,
	instance,
}: {
	cacheKey: string;
	instance: FunctionMocksWithReset<ICacheManager>;
}): void {
	instance.set.mock.mockImplementationOnce(() => ({
		data: cacheKey,
		success: true,
	}));
}
