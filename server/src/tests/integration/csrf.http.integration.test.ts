import assert from "node:assert";
import { after, before, describe, suite, test } from "node:test";

import request from "supertest";

import app from "../../app.js";
import { env } from "../../config/index.js";
import { connectTestDatabase, disconnectTestDatabase } from "../utils/index.js";

const APP_ORIGIN = new URL(env.APP_URL).origin;
const CSRF_MESSAGE = "Cross-site request blocked";

let ipCounter = 0;
function nextClientIp(): string {
	ipCounter += 1;
	return `192.0.2.${ipCounter}`;
}

function isCsrfBlocked(res: request.Response): boolean {
	return res.status === 403 && JSON.stringify(res.body).includes(CSRF_MESSAGE);
}

suite("CSRF protection 〖 Integration Tests 〗", () => {
	before(async () => await connectTestDatabase());
	after(async () => await disconnectTestDatabase());

	describe("state-changing requests", () => {
		const cases: Array<{
			blocked: boolean;
			headers: Record<string, string>;
			name: string;
		}> = [
			{
				blocked: false,
				headers: { "Sec-Fetch-Site": "same-origin" },
				name: "a same-origin browser request",
			},
			{
				blocked: true,
				headers: { "Sec-Fetch-Site": "same-site" },
				name: "a request from a sibling subdomain",
			},
			{
				blocked: true,
				headers: { "Sec-Fetch-Site": "cross-site" },
				name: "a cross-site request",
			},
			{
				blocked: true,
				headers: { "Sec-Fetch-Site": "none" },
				name: "a request not started by a page",
			},
			{
				blocked: false,
				headers: { Origin: APP_ORIGIN },
				name: "an older browser sending only a matching Origin",
			},
			{
				blocked: true,
				headers: { Origin: "https://evil.example" },
				name: "an older browser sending only a foreign Origin",
			},
			{
				blocked: true,
				headers: { Origin: "null" },
				name: "a request with an opaque 'null' Origin",
			},
			{
				blocked: false,
				headers: {},
				name: "a non-browser client sending neither header",
			},
		];

		for (const { blocked, headers, name } of cases) {
			test(`Should ${blocked ? "block" : "allow"} ${name}`, async () => {
				const res = await request(app)
					.post("/api/v1/auth/signin")
					.set("X-Forwarded-For", nextClientIp())
					.set(headers)
					.send({ email: "nobody@example.com", password: "Password123!" });

				assert.strictEqual(isCsrfBlocked(res), blocked);
			});
		}
	});

	test("Should not check safe methods", async () => {
		const res = await request(app)
			.get("/api/v1/products")
			.set("X-Forwarded-For", nextClientIp())
			.set("Sec-Fetch-Site", "cross-site");

		assert.strictEqual(isCsrfBlocked(res), false);
	});

	test("Should not check webhooks (Stripe calls them server to server)", async () => {
		const res = await request(app)
			.post("/api/v1/webhooks/stripe")
			.set("X-Forwarded-For", nextClientIp())
			.set("Origin", "https://evil.example")
			.set("Content-Type", "application/json")
			.send("{}");

		assert.strictEqual(isCsrfBlocked(res), false);
	});

	test("Should not accept HTML form bodies", async () => {
		const res = await request(app)
			.post("/api/v1/auth/signin")
			.set("X-Forwarded-For", nextClientIp())
			.type("form")
			.send({ email: "nobody@example.com", password: "Password123!" });

		// without a body parser for forms, the fields never reach the handler
		assert.notStrictEqual(res.status, 401);
		assert.ok(!JSON.stringify(res.body).includes("Invalid email or password"));
	});
});
