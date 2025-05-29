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
  private static cache = new CacheManager("rate-limit");

  private static _generateCacheKey(req: Request) {
    const ip = req.ip;
    const route = req.baseUrl + req.path;
    const id = `${ip}:${route}`;

    return this.cache.generateKey({ id });
  }

  private static _limiter(config: RateLimitConfig = RATE_LIMIT_CONFIG.DEFAULT) {
    return (req: Request, res: Response, next: NextFunction) => {
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

  private static _saveRateLimitData(
    data: RateLimitData,
    config: RateLimitConfig,
    key: string,
  ) {
    this.cache.set({
      key,
      value: data,
      ttl: Math.ceil(config.windowMs / 1000),
    });
  }

  private static _handleRateLimitExceeded(
    res: Response,
    next: NextFunction,
    data: RateLimitData,
    config: RateLimitConfig,
    key: string,
  ) {
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

  private static _setRateLimitHeaders(
    res: Response,
    data: RateLimitData,
    config: RateLimitConfig,
  ) {
    res.setHeader("X-RateLimit-Limit", config.maxRequests);
    res.setHeader(
      "X-RateLimit-Remaining",
      Math.max(0, config.maxRequests - data.count),
    );
  }

  private static _updateRateLimitData(
    data: RateLimitData,
    config: RateLimitConfig,
  ) {
    const currentTime = Date.now();
    const isTimeWindowExceeded =
      currentTime - data.firstRequestTime > config.windowMs;

    if (isTimeWindowExceeded) {
      return { count: 1, firstRequestTime: currentTime };
    }

    return { ...data, count: data.count + 1 };
  }

  private static _getRateLimitData(key: string): RateLimitData {
    const fallback: RateLimitData = {
      count: 0,
      firstRequestTime: Date.now(),
    };

    return this.cache.get<RateLimitData>({ key }) || fallback;
  }

  private static _handleError(error: unknown, next: NextFunction): void {
    console.error("Rate limiter error: ", error);
    if (error instanceof RateLimitError) {
      next(error);
    } else {
      next(new RateLimitError());
    }
  }

  public static defaultLimiter() {
    return this._limiter(RATE_LIMIT_CONFIG.DEFAULT);
  }

  public static strictLimiter() {
    return this._limiter(RATE_LIMIT_CONFIG.STRICT);
  }

  public static adminLimiter() {
    return this._limiter(RATE_LIMIT_CONFIG.ADMIN);
  }

  public static authLimiter() {
    return this._limiter(RATE_LIMIT_CONFIG.AUTH);
  }
}
