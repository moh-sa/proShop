import { NextFunction, Request, Response } from "express";
import { RATE_LIMIT_CONFIG } from "../config";
import { RateLimitError } from "../errors";
import { CacheManager } from "../managers";
import { RateLimitConfig } from "../types";
interface RateLimitData {
  count: number;
  firstRequestTime: number;
}

export class RateLimiterManager {
  private cache: CacheManager;

  constructor(cache: CacheManager = new CacheManager("rate-limit")) {
    this.cache = cache;
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

  private _limiter(config: RateLimitConfig = RATE_LIMIT_CONFIG.DEFAULT) {
    return async (req: Request, res: Response, next: NextFunction) => {
      try {
        const key = this._generateCacheKey(req);
        const data = this._getRateLimitData(key);

        const updatedData = this._updateRateLimitData(data, config);
        this._setRateLimitHeaders(res, updatedData, config);

        if (updatedData.count > config.maxRequests) {
          this._handleRateLimitExceeded(res, next, updatedData, config, key);
        } else {
          this._saveRateLimitData(updatedData, config, key);
          next();
        }
      } catch (error) {
        this._handleError(error, next);
      }
    };
  }

  private _saveRateLimitData(
    data: RateLimitData,
    config: RateLimitConfig,
    key: string,
  ): void {
    this.cache.set({
      key,
      value: data,
      ttl: Math.ceil(config.windowMs / 1000),
    });
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

  private _getRateLimitData(key: string): RateLimitData {
    const fallback: RateLimitData = {
      count: 0,
      firstRequestTime: Date.now(),
    };

    return this.cache.get<RateLimitData>({ key }) || fallback;
  }

  private _generateCacheKey(req: Request): string {
    const id = `${req.ip}:${req.baseUrl + req.path}`;
    return this.cache.generateKey({ id });
  }

  private _handleError(error: unknown, next: NextFunction): void {
    console.error("Rate limiter error: ", error);
    if (error instanceof RateLimitError) {
      next(error);
    } else {
      next(new RateLimitError());
    }
  }
}

const rateLimiter = new RateLimiterManager();
export const defaultLimiter = rateLimiter.getLimiter();
export const strictLimiter = rateLimiter.getLimiter("STRICT");
export const adminLimiter = rateLimiter.getLimiter("ADMIN");
export const authLimiter = rateLimiter.getLimiter("AUTH");
