import { NextFunction, Request, Response } from "express";
import { RATE_LIMIT_CONFIG } from "../config";
import { RateLimitError } from "../errors";
import { CacheManager } from "../managers";
import { RateLimitConfig } from "../types";

export class RateLimiterMiddleware {
  private static cache = new CacheManager("rate-limit");

  private static generateKey(req: Request) {
    const ip = req.ip;
    const route = req.baseUrl + req.path;
    const id = `${ip}:${route}`;

    return this.cache.generateKey({ id });
  }

  private static limiter(config: RateLimitConfig = RATE_LIMIT_CONFIG.DEFAULT) {
    return (req: Request, res: Response, next: NextFunction) => {
      const key = this.generateKey(req);

      // Get or init rate limit tracking data
      const data = this.cache.get<{
        count: number;
        firstRequestTime: number;
      }>({ key }) || {
        count: 0,
        firstRequestTime: Date.now(),
      };

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
    };
  }

  static defaultLimiter() {
    return this.limiter(RATE_LIMIT_CONFIG.DEFAULT);
  }

  static strictLimiter() {
    return this.limiter(RATE_LIMIT_CONFIG.STRICT);
  }

  static adminLimiter() {
    return this.limiter(RATE_LIMIT_CONFIG.ADMIN);
  }

  static authLimiter() {
    return this.limiter(RATE_LIMIT_CONFIG.AUTH);
  }
}
