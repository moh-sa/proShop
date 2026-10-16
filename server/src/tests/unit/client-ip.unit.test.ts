import assert from "node:assert";
import { describe, suite, test } from "node:test";

import type { Request } from "express";

import { getClientIp, toIpBucket } from "../../utils/index.js";

function fakeRequest(ip: string, cfConnectingIp?: string): Request {
	return {
		headers:
			cfConnectingIp === undefined
				? {}
				: { "cf-connecting-ip": cfConnectingIp },
		ip,
	} as unknown as Request;
}

const CLOUDFLARE_IPV4 = "172.68.234.210";
const CLOUDFLARE_IPV6 = "2606:4700:10::6816:1";

suite("Client IP 〖 Unit Tests 〗", () => {
	describe("getClientIp", () => {
		const cases: Array<{
			cfConnectingIp?: string;
			expected: string;
			name: string;
			peer: string;
		}> = [
			{
				cfConnectingIp: "203.0.113.7",
				expected: "203.0.113.7",
				name: "use 'CF-Connecting-IP' when the peer is a Cloudflare IPv4",
				peer: CLOUDFLARE_IPV4,
			},
			{
				cfConnectingIp: "2001:db8::1",
				expected: "2001:db8::1",
				name: "use 'CF-Connecting-IP' when the peer is a Cloudflare IPv6",
				peer: CLOUDFLARE_IPV6,
			},
			{
				cfConnectingIp: "203.0.113.7",
				expected: "198.51.100.9",
				name: "ignore a spoofed 'CF-Connecting-IP' from a non-Cloudflare peer",
				peer: "198.51.100.9",
			},
			{
				cfConnectingIp: "not-an-ip",
				expected: CLOUDFLARE_IPV4,
				name: "fall back to the peer when 'CF-Connecting-IP' is invalid",
				peer: CLOUDFLARE_IPV4,
			},
			{
				expected: CLOUDFLARE_IPV4,
				name: "fall back to the peer when 'CF-Connecting-IP' is missing",
				peer: CLOUDFLARE_IPV4,
			},
			{
				cfConnectingIp: "203.0.113.7",
				expected: "203.0.113.7",
				name: "unwrap an IPv4-mapped IPv6 peer",
				peer: `::ffff:${CLOUDFLARE_IPV4}`,
			},
			{
				expected: "127.0.0.1",
				name: "unwrap an IPv4-mapped loopback (local dev)",
				peer: "::ffff:127.0.0.1",
			},
		];

		for (const { cfConnectingIp, expected, name, peer } of cases) {
			test(`Should ${name}`, () => {
				assert.strictEqual(
					getClientIp(fakeRequest(peer, cfConnectingIp)),
					expected,
				);
			});
		}
	});

	describe("toIpBucket", () => {
		test("Should keep an IPv4 address as is", () => {
			assert.strictEqual(toIpBucket("203.0.113.7"), "203.0.113.7");
		});

		test("Should reduce IPv6 addresses in the same /64 to one bucket", () => {
			assert.strictEqual(
				toIpBucket("2a02:ce0:2004:392:3c22:a7d3:3104:e676"),
				toIpBucket("2a02:ce0:2004:392::1"),
			);
		});

		test("Should keep different /64 networks in different buckets", () => {
			assert.notStrictEqual(
				toIpBucket("2a02:ce0:2004:392::1"),
				toIpBucket("2a02:ce0:2004:393::1"),
			);
		});

		test("Should treat compressed and expanded IPv6 forms as the same bucket", () => {
			assert.strictEqual(
				toIpBucket("2001:db8::1"),
				toIpBucket("2001:0db8:0000:0000:0000:0000:0000:0001"),
			);
		});
	});
});
