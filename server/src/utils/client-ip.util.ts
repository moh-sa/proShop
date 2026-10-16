import { BlockList, isIP } from "node:net";

import type { Request } from "express";

/**
 * Cloudflare edge ranges.
 * Source: https://www.cloudflare.com/ips-v4 and https://www.cloudflare.com/ips-v6
 * Last checked: 2026-10-16 - re-copy both lists when Cloudflare announces changes.
 */
const CLOUDFLARE_IPV4_RANGES = [
	"173.245.48.0/20",
	"103.21.244.0/22",
	"103.22.200.0/22",
	"103.31.4.0/22",
	"141.101.64.0/18",
	"108.162.192.0/18",
	"190.93.240.0/20",
	"188.114.96.0/20",
	"197.234.240.0/22",
	"198.41.128.0/17",
	"162.158.0.0/15",
	"104.16.0.0/13",
	"104.24.0.0/14",
	"172.64.0.0/13",
	"131.0.72.0/22",
];

const CLOUDFLARE_IPV6_RANGES = [
	"2400:cb00::/32",
	"2606:4700::/32",
	"2803:f800::/32",
	"2405:b500::/32",
	"2405:8100::/32",
	"2a06:98c0::/29",
	"2c0f:f248::/32",
];

const cloudflareRanges = new BlockList();
for (const range of CLOUDFLARE_IPV4_RANGES) {
	const [network, prefix] = range.split("/");
	cloudflareRanges.addSubnet(network, Number(prefix), "ipv4");
}
for (const range of CLOUDFLARE_IPV6_RANGES) {
	const [network, prefix] = range.split("/");
	cloudflareRanges.addSubnet(network, Number(prefix), "ipv6");
}

const IPV4_MAPPED_PREFIX = "::ffff:";

/**
 * Real client IP behind Cloudflare -> Traefik -> Express.
 *
 * `req.ip` is the peer Traefik saw (Traefik overwrites `X-Forwarded-For`, so it
 * can't be spoofed). `CF-Connecting-IP` is trusted only when that peer is
 * Cloudflare; anyone bypassing Cloudflare is identified by their real address.
 */
export function getClientIp(req: Request): string {
	const peer = normalizeIp(req.ip ?? req.socket?.remoteAddress ?? "");

	const cfConnectingIp = req.headers["cf-connecting-ip"];
	if (
		typeof cfConnectingIp === "string" &&
		isIP(cfConnectingIp) !== 0 &&
		isCloudflareIp(peer)
	) {
		return normalizeIp(cfConnectingIp);
	}

	return peer;
}

/**
 * Rate-limit bucket for an IP. One IPv6 user usually controls a whole /64,
 * so IPv6 addresses are grouped by their first 64 bits.
 */
export function toIpBucket(ip: string): string {
	if (isIP(ip) !== 6) {
		return ip;
	}

	return `${expandIpv6(ip).slice(0, 4).join(":")}::/64`;
}

function expandIpv6(ip: string): Array<string> {
	const [head, tail] = ip.toLowerCase().split("::");
	const headGroups = head ? head.split(":") : [];
	const tailGroups = tail ? tail.split(":") : [];
	const zeros = Array<string>(8 - headGroups.length - tailGroups.length).fill(
		"0",
	);

	return [
		...headGroups,
		...(tail === undefined ? [] : zeros),
		...tailGroups,
	].map((group) => group.replace(/^0+(?=.)/, ""));
}

function isCloudflareIp(ip: string): boolean {
	const family = isIP(ip);
	if (family === 0) {
		return false;
	}

	return cloudflareRanges.check(ip, family === 4 ? "ipv4" : "ipv6");
}

function normalizeIp(ip: string): string {
	const lower = ip.toLowerCase();
	if (lower.startsWith(IPV4_MAPPED_PREFIX)) {
		const ipv4 = lower.slice(IPV4_MAPPED_PREFIX.length);
		if (isIP(ipv4) === 4) {
			return ipv4;
		}
	}

	return ip;
}
