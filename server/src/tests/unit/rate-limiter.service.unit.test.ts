import { suite } from "node:test";

import type { CacheService } from "../../services/index.js";
import { RateLimiterService } from "../../services/index.js";
import { mockNodeCache } from "../mocks/index.js";

suite("Rate Limiter Service〖 Unit Tests 〗", { todo: "IMPLEMENT" }, () => {
	const mockStorage = mockNodeCache();
	const _service = new RateLimiterService(
		mockStorage as unknown as CacheService,
	);

	// I AM TIRED BOSS :')
});
