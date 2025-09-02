import { beforeEach, suite } from "node:test";

import { RateLimiterService } from "../../services/index.js";

suite(
	"Rate Limiter Service 〖 Integration Tests 〗",
	{ todo: "IMPLEMENT" },
	() => {
		const service = new RateLimiterService();

		beforeEach(async () => {
			service.clearCache();
		});

		// I AM TIRED BOSS :')
	},
);
