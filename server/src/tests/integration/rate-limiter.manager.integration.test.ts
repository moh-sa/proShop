import { beforeEach, suite } from "node:test";

import { RateLimiterManager } from "../../managers/rate-limit.manager.js";

suite(
	"Rate Limiter Manager 〖 Integration Tests 〗",
	{ todo: "IMPLEMENT" },
	() => {
		const manager = new RateLimiterManager();

		beforeEach(async () => {
			manager.clearCache();
		});

		// I AM TIRED BOSS :')
	},
);
