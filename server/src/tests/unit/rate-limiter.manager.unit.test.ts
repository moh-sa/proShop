import { suite } from "node:test";

import { RateLimiterManager } from "../../managers/rate-limit.manager.js";
import { mockNodeCache } from "../mocks/cache-NodeCache.mock.js";

suite("Rate Limiter Manager〖 Unit Tests 〗", { todo: "IMPLEMENT" }, () => {
	const mockStorage = mockNodeCache();
	const manager = new RateLimiterManager(mockStorage as any); // eslint-disable-line @typescript-eslint/no-unused-vars

	// I AM TIRED BOSS :')
});
