import type { NextFunction, Request, Response } from "express";

import type { RateLimitConfig } from "../types/index.js";

import { RATE_LIMIT_CONFIG } from "../config/index.js";
import { RateLimitError } from "../errors/index.js";
import { getLoggerFromContext } from "../utils/index.js";
import { CacheService } from "./cache.service.js";

interface RateLimitData {
	count: number;
	firstRequestTime: number;
}

export class RateLimiterService {
	private _cache: CacheService;

	constructor(cache: CacheService = new CacheService("rate-limit")) {
		this._cache = cache;
	}

	public clearCache(keys?: Array<string> | string): void {
		const logger = this._getLogger({ method: "clearCache" });
		logger.debug({ keys }, "Clearing rate limit cache");

		// FIXME: refactor this. probably gonna split this into multiple functions
		if (!(Array.isArray(keys) || typeof keys === "string")) {
			return this._cache.flush();
		}

		// this.cache.delete({ keys });

		logger.info("Rate limit cache cleared successfully");
	}

	public getLimiter(
		options:
			| keyof typeof RATE_LIMIT_CONFIG
			| RateLimitConfig = RATE_LIMIT_CONFIG.DEFAULT,
	) {
		const config =
			typeof options === "string" ? RATE_LIMIT_CONFIG[options] : options;

		return this._limiter(config);
	}

	private _generateId(req: Request): string {
		return `${req.ip}:${req.baseUrl + req.path}`;
	}

	private _getLogger(args: { [key: string]: unknown; method: string }) {
		return getLoggerFromContext().child({
			layer: "rate limiting service",
			...args,
		});
	}

	private _getRateLimitData(key: string): RateLimitData {
		const fallback: RateLimitData = {
			count: 0,
			firstRequestTime: Date.now(),
		};

		const result = this._cache.get<RateLimitData>({ key });
		if (!result.success || !result.data) {
			return fallback;
		}

		return result.data;
	}

	private _handleError(error: unknown, next: NextFunction): void {
		console.error("Rate limiter error: ", error);
		if (error instanceof RateLimitError) {
			next(error);
		} else {
			next(new RateLimitError());
		}
	}

	private _handleRateLimitExceeded(
		res: Response,
		next: NextFunction,
		data: RateLimitData,
		config: RateLimitConfig,
		key: string,
	): void {
		const currentTime = Date.now();
		const retryAfter = Math.ceil(
			(config.windowMs - (currentTime - data.firstRequestTime)) / 1000,
		);

		res.setHeader("Retry-After", retryAfter);
		console.warn(
			`Rate limit exceeded for ${key}. Retry after ${retryAfter} seconds.`,
		);

		this._handleError(new RateLimitError(config.message), next);
	}

	private _limiter(config: RateLimitConfig = RATE_LIMIT_CONFIG.DEFAULT) {
		const logger = this._getLogger({ method: "limiter" });
		logger.debug({ config }, "Getting rate limit limiter");

		return async (req: Request, res: Response, next: NextFunction) => {
			try {
				const key = this._generateId(req);
				logger.debug({ key }, "Generated rate limit key");

				const data = this._getRateLimitData(key);
				logger.debug({ data }, "Got rate limit data");

				const updatedData = this._updateRateLimitData(data, config);
				logger.debug({ updatedData }, "Updated rate limit data");

				this._setRateLimitHeaders(res, updatedData, config);

				if (updatedData.count > config.maxRequests) {
					logger.warn({ updatedData }, "Rate limit exceeded");
					this._handleRateLimitExceeded(res, next, updatedData, config, key);
				} else {
					this._saveRateLimitData(updatedData, config, key);
					next();
				}

				logger.info({ key }, "Rate limit data saved successfully");
			} catch (error) {
				logger.error({ error }, "Error in rate limit limiter");
				this._handleError(error, next);
			}
		};
	}

	private _saveRateLimitData(
		data: RateLimitData,
		config: RateLimitConfig,
		key: string,
	): void {
		const isSet = this._cache.set({
			key,
			ttl: Math.ceil(config.windowMs / 1000),
			value: data,
		});
		if (!isSet.success) {
			console.error("Failed to set rate limit data", key);
			throw isSet.error;
		}
	}

	private _setRateLimitHeaders(
		res: Response,
		data: RateLimitData,
		config: RateLimitConfig,
	): void {
		res.setHeader("X-RateLimit-Limit", config.maxRequests);
		res.setHeader(
			"X-RateLimit-Remaining",
			Math.max(0, config.maxRequests - data.count),
		);
	}

	private _updateRateLimitData(
		data: RateLimitData,
		config: RateLimitConfig,
	): RateLimitData {
		const currentTime = Date.now();
		const isTimeWindowExceeded =
			currentTime - data.firstRequestTime > config.windowMs;

		if (isTimeWindowExceeded) {
			return { count: 1, firstRequestTime: currentTime };
		}

		return { ...data, count: data.count + 1 };
	}
}

const rateLimiter = new RateLimiterService();
export const defaultLimiter = rateLimiter.getLimiter();
export const strictLimiter = rateLimiter.getLimiter("STRICT");
export const adminLimiter = rateLimiter.getLimiter("ADMIN");
export const authLimiter = rateLimiter.getLimiter("AUTH");
