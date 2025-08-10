import type { RateLimitConfig } from "../types/index.js";

export const RATE_LIMIT_CONFIG: Record<
  "ADMIN" | "AUTH" | "DEFAULT" | "STRICT",
  RateLimitConfig
> = {
  ADMIN: {
    maxRequests: 50,
    message: "Admin rate limit exceeded.",
    windowMs: 5 * 60 * 1000, // 5 minutes
  },
  AUTH: {
    maxRequests: 10,
    message: "Too many authentication attempts. Please try again later.",
    windowMs: 15 * 60 * 1000, // 15 minutes
  },
  DEFAULT: {
    maxRequests: 100,
    message: "Too many requests, please try again later.",
    windowMs: 15 * 60 * 1000, // 15 minutes
  },
  STRICT: {
    maxRequests: 4,
    message: "Rate limit exceeded. Slow down.",
    windowMs: 60 * 1000, // 1 minute
  },
};
