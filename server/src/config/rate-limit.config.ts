import { RateLimitConfig } from "../types";

export const RATE_LIMIT_CONFIG: Record<
  "DEFAULT" | "STRICT" | "ADMIN" | "AUTH",
  RateLimitConfig
> = {
  DEFAULT: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 100,
    message: "Too many requests, please try again later.",
  },
  STRICT: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 4,
    message: "Rate limit exceeded. Slow down.",
  },
  ADMIN: {
    windowMs: 5 * 60 * 1000, // 5 minutes
    maxRequests: 50,
    message: "Admin rate limit exceeded.",
  },
  AUTH: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 10,
    message: "Too many authentication attempts. Please try again later.",
  },
};
