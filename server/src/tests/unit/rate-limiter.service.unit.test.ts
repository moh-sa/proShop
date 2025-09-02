import { suite } from "node:test";

import { RateLimiterService } from "../../services/index.js";
import { mockNodeCache } from "../mocks/index.js";

suite("Rate Limiter Service〖 Unit Tests 〗", { todo: "IMPLEMENT" }, () => {
	const mockStorage = mockNodeCache();
	const service = new RateLimiterService(mockStorage as any); // eslint-disable-line @typescript-eslint/no-unused-vars

	// I AM TIRED BOSS :')
});
