import { NextFunction, Request, Response } from "express";
import { RATE_LIMIT_CONFIG } from "../config";
import { RateLimitError } from "../errors";
import { CacheManager } from "../managers";
import { RateLimitConfig } from "../types";

interface RateLimitData {
  count: number;
  firstRequestTime: number;
}

export class RateLimiterMiddleware {
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

        // Check if the client exceeded the time window
        const currentTime = Date.now();
        const isTimeWindowExceeded =
          currentTime - data.firstRequestTime > config.windowMs;
        if (isTimeWindowExceeded) {
          // Reset if the time window has passed
          data.count = 1;
          data.firstRequestTime = currentTime;
        } else {
          // Increment the request count
          data.count++;
        }

        // Check if max requests exceeded
        if (data.count > config.maxRequests) {
          throw new RateLimitError(config.message);
        }

        // Update cache
        this.cache.set({
          key,
          value: data,
          ttl: Math.ceil(config.windowMs / 1000),
        });

        next();
      } catch (error) {
        this._handleError(error, next);
      }
    };
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
